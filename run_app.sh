#!/bin/bash

# 获取当前脚本所在目录（在 .app 内部时为 Resources 目录）
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

# 使用捆绑在 .app 内部的虚拟环境中的 Python 运行 Streamlit
# 这确保了即使系统没装 Python 或 Streamlit 也能运行
if [ -f "./venv/bin/python" ]; then
    ./venv/bin/python -m streamlit run app.py --browser.gatherUsageStats false
else
    # 回退方案：尝试系统路径（如果 venv 没被正确打包）
    export PATH="$PATH:/usr/local/bin:/opt/homebrew/bin"
    streamlit run app.py --browser.gatherUsageStats false
fi
