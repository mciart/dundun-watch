-- 炖炖哨兵 D1 数据库迁移脚本
-- 此脚本用于增量更新数据库结构，在 GitHub Actions 部署时自动执行
-- 使用 ALTER TABLE 添加新列，如果列已存在会报错但不影响后续执行

-- ==================== 迁移 v1.1: 添加 TCP 主机名字段 ====================
-- 日期: 2025-12-21
-- 说明: TCP 监控需要存储主机名
ALTER TABLE sites ADD COLUMN tcp_host TEXT;

-- ==================== 迁移 v1.2: 添加事件类型字段 ====================
-- 日期: 2025-12-21
-- 说明: incidents 表需要 type 字段来区分事件类型 (down/recovered/cert_warning)
ALTER TABLE incidents ADD COLUMN type TEXT DEFAULT 'down';
