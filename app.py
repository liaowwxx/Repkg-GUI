import streamlit as st
import subprocess
import os
import sys
import platform
# 移除了直接的 tkinter 导入，改为在子进程中调用，以修复 macOS 主线程限制导致的崩溃

# 操作系统检测
IS_WINDOWS = platform.system() == "Windows"
IS_MAC = platform.system() == "Darwin"

def fix_path(path):
    """根据操作系统修复路径格式"""
    if not path:
        return path
    if IS_MAC:
        # 将 Windows 风格的反斜杠替换为正斜杠
        return path.replace("\\", "/")
    return path

def select_folder(title="选择文件夹"):
    """在 macOS 上使用 AppleScript，在 Windows 上回退到子进程 Tkinter"""
    if IS_MAC:
        script = f'POSIX path of (choose folder with prompt "{title}")'
        try:
            # -e 执行脚本
            result = subprocess.check_output(['osascript', '-e', script], text=True, stderr=subprocess.DEVNULL)
            return result.strip()
        except subprocess.CalledProcessError:
            # 用户取消选择
            return ""
        except Exception as e:
            st.error(f"macOS 选择文件夹出错: {e}")
            return ""
    else:
        # Windows 保持使用子进程 Tkinter
        script = f"""
import tkinter as tk
from tkinter import filedialog
root = tk.Tk()
root.withdraw()
folder_path = filedialog.askdirectory(title='{title}')
root.destroy()
if folder_path: print(folder_path, end='')
"""
        try:
            result = subprocess.check_output([sys.executable, "-c", script], text=True)
            return result.strip()
        except Exception as e:
            st.error(f"选择文件夹时发生错误: {e}")
            return ""

def select_file(title="选择文件", filetypes=[("All files", "*.*")]):
    """在 macOS 上使用 AppleScript，在 Windows 上回退到子进程 Tkinter"""
    if IS_MAC:
        script = f'POSIX path of (choose file with prompt "{title}")'
        try:
            result = subprocess.check_output(['osascript', '-e', script], text=True, stderr=subprocess.DEVNULL)
            return result.strip()
        except subprocess.CalledProcessError:
            # 用户取消选择
            return ""
        except Exception as e:
            st.error(f"macOS 选择文件出错: {e}")
            return ""
    else:
        # Windows 逻辑
        filetypes_str = str(filetypes)
        script = f"""
import tkinter as tk
from tkinter import filedialog
root = tk.Tk()
root.withdraw()
file_path = filedialog.askopenfilename(title='{title}', filetypes={filetypes_str})
root.destroy()
if file_path: print(file_path, end='')
"""
        try:
            result = subprocess.check_output([sys.executable, "-c", script], text=True)
            return result.strip()
        except Exception as e:
            st.error(f"选择文件时发生错误: {e}")
            return ""

# 设置页面配置
st.set_page_config(
    page_title="RePKG WebUI",
    page_icon="📦",
    layout="wide",
    initial_sidebar_state="expanded",
)

# 自定义 CSS 样式
st.markdown("""
<style>
    .reportview-container {
        background: #f0f2f6
    }
    .stCodeBlock {
        background-color: #262730;
        color: #ffffff;
    }
    .path-input-container {
        display: flex;
        align-items: flex-end;
    }
</style>
""", unsafe_allow_html=True)

st.title("📦 RePKG WebUI")
st.markdown("---")

# 检查可执行文件路径
# 用户说明：repkg 以及支持文件在 resources/osx-arm64 文件夹下
# 运行时需要在 repkg 前加上 ./

# 自动识别运行环境，获取正确的根目录
if getattr(sys, 'frozen', False) or "__compiled__" in globals():
    # 如果在打包环境（如 .app 内部）
    base_dir = os.path.dirname(os.path.abspath(sys.argv[0]))
else:
    # 如果在普通 python 运行环境，使用当前脚本所在目录
    base_dir = os.path.dirname(os.path.abspath(__file__))

base_resources_dir = os.path.join(base_dir, "resources")
osx_arm64_dir = os.path.join(base_resources_dir, "osx-arm64")
default_output_dir = os.path.join(base_dir, "outputs")

# 确保输出目录存在
if not os.path.exists(default_output_dir):
    try:
        os.makedirs(default_output_dir, exist_ok=True)
    except:
        pass

if IS_WINDOWS:
    executable_name = "RePKG.exe"
else:
    executable_name = "RePKG"

executable = os.path.join(osx_arm64_dir, executable_name)

if not os.path.exists(executable):
    st.error(f"未找到可执行文件 '{executable_name}'。请确保它位于 resources/osx-arm64 目录下。")
    st.stop()

# 在 macOS 上确保有执行权限
if IS_MAC and os.path.exists(executable):
    if not os.access(executable, os.X_OK):
        try:
            os.chmod(executable, 0o755)
        except Exception as e:
            st.warning(f"无法自动设置执行权限，请手动执行: chmod +x {executable}")

def run_command(args, key=None):
    """运行外部命令并实时显示输出"""
    # ... (省略中间注释)
    
    cmd_prefix = "./" if not IS_WINDOWS else ""
    full_cmd = [f"{cmd_prefix}{executable_name}"] + args
    
    st.subheader("执行命令")
    st.code(" ".join(full_cmd), language="bash")
    
    st.subheader("输出日志")
    log_container = st.empty()
    logs = []
    
    # 使用 subprocess.Popen 实时获取输出
    try:
        process = subprocess.Popen(
            full_cmd,
            cwd=osx_arm64_dir, # 在 resources/osx-arm64 目录下执行
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
            universal_newlines=True
        )
        
        # 记录是否是第一次创建 text_area
        is_first_render = True
        
        for line in process.stdout:
            logs.append(line)
            # 为了性能，只显示最后 500 行
            display_logs = "".join(logs[-500:]) 
            
            # 只有在第一次渲染时传递 key，后续更新时 Streamlit 会通过容器自动处理
            if is_first_render and key:
                log_container.text_area("Logs", value=display_logs, height=400, label_visibility="collapsed", key=key)
                is_first_render = False
            else:
                log_container.text_area("Logs", value=display_logs, height=400, label_visibility="collapsed")
        
        process.wait()
        
        if process.returncode == 0:
            st.success("✅ 命令执行成功")
        else:
            st.error(f"❌ 命令执行失败，退出代码: {process.returncode}")
            
    except Exception as e:
        st.error(f"发生错误: {str(e)}")

# 侧边栏：选择命令和主要操作
with st.sidebar:
    st.header("控制面板")
    command_mode = st.selectbox("选择功能", ["Extract (提取)", "Info (信息)", "Help (帮助)"])
    
    st.markdown("---")
    st.info("""
    **RePKG 功能说明**:
    - 提取 PKG 文件
    - 将 PKG 转换为 Wallpaper Engine 项目
    - 将 TEX 转换为图像
    - 查看 PKG/TEX 详细信息
    """)

if command_mode == "Help (帮助)":
    st.header("帮助文档")
    help_target = st.radio("查看帮助详情", ["通用帮助", "Extract 帮助", "Info 帮助"], horizontal=True)
    
    if st.button("获取帮助"):
        if help_target == "通用帮助":
            run_command(["help"])
        elif help_target == "Extract 帮助":
            run_command(["help", "extract"])
        elif help_target == "Info 帮助":
            run_command(["help", "info"])

elif command_mode == "Extract (提取)":
    st.header("文件提取 (Extract)")
    
    # 初始化 session state
    if 'extract_input_path' not in st.session_state:
        st.session_state.extract_input_path = ""
    if 'extract_output_dir' not in st.session_state:
        st.session_state.extract_output_dir = default_output_dir

    # 输入路径选择
    col_input, col_pick_file, col_pick_folder = st.columns([6, 1, 1])
    with col_input:
        input_path = st.text_input("输入路径", value=st.session_state.extract_input_path, placeholder="PKG/TEX 文件路径或包含这些文件的目录路径")
        st.session_state.extract_input_path = input_path
    with col_pick_file:
        st.write(" ") # 间距
        if st.button("📁 文件", key="pick_extract_file"):
            path = select_file("选择 PKG 或 TEX 文件")
            if path:
                st.session_state.extract_input_path = path
                st.rerun()
    with col_pick_folder:
        st.write(" ") # 间距
        if st.button("📂 目录", key="pick_extract_folder"):
            path = select_folder("选择包含 PKG/TEX 的目录")
            if path:
                st.session_state.extract_input_path = path
                st.rerun()
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.subheader("输出设置")
        col_out, col_pick_out = st.columns([4, 1])
        with col_out:
            output_dir = st.text_input("输出目录 (-o)", value=st.session_state.extract_output_dir)
            st.session_state.extract_output_dir = output_dir
        with col_pick_out:
            st.write(" ") # 间距
            if st.button("📂 选择", key="pick_extract_output"):
                path = select_folder("选择输出目录")
                if path:
                    st.session_state.extract_output_dir = path
                    st.rerun()
                    
        ignore_exts = st.text_input("忽略扩展名 (-i)", placeholder="例如: txt,log (用逗号分隔)")
        only_exts = st.text_input("仅提取扩展名 (-e)", placeholder="例如: tex,json")
        
    with col2:
        st.subheader("转换选项")
        convert_tex = st.checkbox("将 TEX 转换为图像 (-t)", help="如果勾选，将把所有 TEX 文件转换为图片")
        no_tex_convert = st.checkbox("禁止 TEX 转换 (--no-tex-convert)", help="提取 PKG 时不转换 TEX 文件")
        overwrite = st.checkbox("覆盖现有文件 (--overwrite)")
        
    with st.expander("高级选项"):
        ac_col1, ac_col2 = st.columns(2)
        with ac_col1:
            debug_info = st.checkbox("打印调试信息 (-d)")
            recursive = st.checkbox("递归搜索目录 (-r)", value=True)
            single_dir = st.checkbox("放入单一目录 (-s)", help="所有提取的文件放入同一个目录，不保留原始路径")
            skip_errors = st.checkbox("批量容错模式", value=True, help="如果勾选且输入为目录，将逐个处理文件。即使某个文件解包失败，也会跳过并继续处理下一个。")
        with ac_col2:
            copy_project = st.checkbox("复制项目文件 (-c)", help="复制 project.json 和预览图到输出目录")
            use_name = st.checkbox("使用项目名称 (-n)", help="使用 project.json 中的名称作为子文件夹名而非 ID")

    if st.button("开始执行提取", type="primary"):
        if not input_path:
            st.warning("⚠️ 请输入有效的输入路径")
        else:
            # 路径修复逻辑并转换为绝对路径，防止切换 cwd 后路径失效
            final_input = os.path.abspath(fix_path(input_path))
            final_output = os.path.abspath(fix_path(output_dir))
            
            base_args = ["extract"]
            if final_output: base_args += ["-o", final_output]
            if ignore_exts: base_args += ["-i", ignore_exts]
            if only_exts: base_args += ["-e", only_exts]
            if debug_info: base_args.append("-d")
            if convert_tex: base_args.append("-t")
            if single_dir: base_args.append("-s")
            if recursive: base_args.append("-r")
            if copy_project: base_args.append("-c")
            if use_name: base_args.append("-n")
            if no_tex_convert: base_args.append("--no-tex-convert")
            if overwrite: base_args.append("--overwrite")

            # 批量容错逻辑
            if skip_errors and os.path.isdir(final_input):
                files_to_process = []
                for root, dirs, files in os.walk(final_input):
                    for file in files:
                        if file.lower().endswith(('.pkg', '.tex')):
                            files_to_process.append(os.path.join(root, file))
                    if not recursive: # 如果不递归，只看第一层
                        break
                
                if not files_to_process:
                    st.warning("📂 目录下未找到可处理的 .pkg 或 .tex 文件")
                else:
                    st.info(f"🚀 批量模式：准备处理 {len(files_to_process)} 个文件...")
                    progress_bar = st.progress(0)
                    for i, file_path in enumerate(files_to_process):
                        st.markdown(f"### 正在处理 ({i+1}/{len(files_to_process)})")
                        st.code(file_path)
                        # 批量模式下不需要传递 -r 给 repkg，因为 Python 已经处理了递归
                        batch_args = [a for a in base_args if a != "-r"]
                        # 使用索引 i 确保每个文件的 key 绝对唯一
                        run_command(batch_args + [file_path], key=f"log_batch_{i}")
                        progress_bar.progress((i + 1) / len(files_to_process))
                        st.markdown("---")
            else:
                # 普通模式：直接把路径传给 repkg
                run_command(base_args + [final_input], key="single_extract")

elif command_mode == "Info (信息)":
    st.header("查看信息 (Info)")
    
    # 初始化 session state
    if 'info_input_path' not in st.session_state:
        st.session_state.info_input_path = ""

    # 输入路径选择
    col_input, col_pick_file, col_pick_folder = st.columns([6, 1, 1])
    with col_input:
        info_path = st.text_input("输入路径", value=st.session_state.info_input_path, placeholder="PKG/TEX 文件路径或包含这些文件的目录路径")
        st.session_state.info_input_path = info_path
    with col_pick_file:
        st.write(" ") # 间距
        if st.button("📁 文件", key="pick_info_file"):
            path = select_file("选择 PKG 或 TEX 文件")
            if path:
                st.session_state.info_input_path = path
                st.rerun()
    with col_pick_folder:
        st.write(" ") # 间距
        if st.button("📂 目录", key="pick_info_folder"):
            path = select_folder("选择包含 PKG/TEX 的目录")
            if path:
                st.session_state.info_input_path = path
                st.rerun()
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.subheader("排序设置")
        sort_enabled = st.checkbox("启用排序 (-s)")
        sort_by = st.selectbox("排序方式 (-b)", ["name", "extension", "size"])
        
    with col2:
        st.subheader("显示设置")
        print_entries = st.checkbox("打印包内条目 (-e)")
        tex_info = st.checkbox("查看 TEX 详细信息 (-t)")

    with st.expander("过滤与特定信息"):
        project_info = st.text_input("项目信息字段 (-p)", placeholder="例如: *, title, description (逗号分隔)")
        title_filter = st.text_input("标题过滤 (--title-filter)", placeholder="仅显示匹配标题的项")

    if st.button("获取信息", type="primary"):
        if not info_path:
            st.warning("⚠️ 请输入有效的输入路径")
        else:
            # 路径修复逻辑并转换为绝对路径
            final_info_path = os.path.abspath(fix_path(info_path))
            
            args = ["info"]
            if sort_enabled: args.append("-s")
            if sort_by: args += ["-b", sort_by]
            if tex_info: args.append("-t")
            if project_info: args += ["-p", project_info]
            if print_entries: args.append("-e")
            if title_filter: args += ["--title-filter", title_filter]
            args.append(final_info_path)
            
            run_command(args, key="info_log")

# 页脚
st.markdown("---")
st.markdown(
    """
    <div style='text-align: center; color: grey;'>
        Built with Streamlit for RePKG
    </div>
    """,
    unsafe_allow_html=True
)
