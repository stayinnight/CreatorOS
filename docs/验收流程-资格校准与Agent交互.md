# 资格校准与 Agent 交互验收流程

## 启动

```bash
npm install
npm run dev
```

打开终端提示的本地地址。若浏览器保留了旧演示状态，先点击 Reset。

## 演示顺序

1. 在 Campaign Agent Desk 加载 3 份客户材料，启动 Agent Run。
2. 解决上线周期与相邻运动范围两个冲突，生成 Brief v1。
3. 生成并锁定 Creator Mix，生成 6 个 Search Packages。
4. 启动候选 sourcing，点击“开始 10 人校准”，确认右侧 Inspector 平滑打开。
5. 查看一名 Qualified Creator：应看到六项资格门禁、证据置信度、头戴摄像头 Evidence 和 Fit Score。
6. 点击“为什么推荐他？”：聊天区先追加用户消息，再依次显示“正在理解请求”“正在调用工作区工具”“正在组织回答”，最后以打字机效果出现答案；完成后可展开查看工作区检查。
7. 尝试“哪条证据证明适合头戴摄像头？”“他有什么风险？”和“预算风险”，确认工具步骤与答案内容随问题变化。
8. 切换到 Torque Atlas：其制作能力再高，也应因只有摩托车内容而显示 Disqualified，且不显示 Fit Score。
9. 对一名 Qualified Creator 选择 `Too commercial`：先查看影响预览，再点击“应用并重排”。重复相同原因不应新增重复偏好。
10. Accept 至少 2 名 Qualified Creator，审阅至少 1 个失败样本，总审阅人数达到 3；应用一次偏好或点击“无需调整”。
11. 点击“批准方向并扩展 30 + 10”：生成 30 名 Primary 与 10 名内部 Backup，并进入客户投影校验。

## 交互检查

- 用户停留在聊天底部时，阶段变化和打字机会自然跟随。
- 用户主动向上滚动后，页面不能抢回底部；应出现“回到最新”。
- 打开、关闭或重新打开 Inspector 不改变聊天阅读位置，并保留当前候选与审阅结果。
- Agent 工作期间 Composer 和快捷操作不可重复提交。
- 系统开启“减少动态效果”时，答案直接完整显示，功能与内容不变。

## 自动化验证

```bash
npm test
npm run build
git diff --check
```

三条命令都成功才算 P0 验收通过。
