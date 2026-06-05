#!/bin/bash

# 进入hexo博客目录
cd "D:\Blog" || {
    echo "无法进入D:\Blog目录，请检查路径是否正确"
    read -p "按任意键退出..."
    exit 1
}

# 执行hexo命令
echo "正在执行 hexo clean..."
hexo clean
if [ $? -eq 0 ]; then
    echo "hexo clean 完成！"
else
    echo "hexo clean 失败！"
    read -p "按任意键退出..."
    exit 1
fi

echo "正在执行 hexo generate..."
hexo generate
if [ $? -eq 0 ]; then
    echo "hexo generate 完成！"
else
    echo "hexo generate 失败！"
    read -p "按任意键退出..."
    exit 1
fi

echo "正在执行 hexo deploy..."
hexo deploy
if [ $? -eq 0 ]; then
    echo "hexo deploy 完成！"
else
    echo "hexo deploy 失败！"
    read -p "按任意键退出..."
    exit 1
fi

echo "所有命令执行完毕，按任意键退出..."
read -p ""
