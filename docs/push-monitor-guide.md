# Push 心跳监控使用指南

Push 心跳监控（也称为被动监控）是一种主机主动向监控系统发送心跳的监控方式，特别适合以下场景：

- 📡 **内网主机**：无公网 IP 的 NAS、家庭服务器、内网服务器
- 🔒 **防火墙限制**：入站端口被严格限制的服务器
- 📊 **详细指标**：需要上报 CPU、内存、磁盘等详细系统指标的主机

## 工作原理

```
┌─────────────────┐         POST /api/push/:token         ┌──────────────────┐
│   你的主机      │  ──────────────────────────────────>  │  炖炖哨兵 Worker │
│  (运行脚本)     │    {"cpu": 25, "memory": 60, ...}     │   (接收心跳)     │
└─────────────────┘                                        └──────────────────┘
     每分钟                                                      记录状态
```

1. 主机上运行心跳脚本，定时（建议每分钟）向 Worker 发送 POST 请求
2. Worker 接收到请求后，更新站点的 `lastHeartbeat` 时间和系统指标
3. 如果超过设定的超时时间（默认 3 分钟）未收到心跳，则判定为离线

## 快速开始

### 1. 在后台添加 Push 监控

1. 登录管理后台
2. 点击「添加站点」
3. 选择监控类型为「Push 心跳」
4. 填写主机名称，设置超时时间
5. 保存后，系统会生成专属的 Token 和上报地址

### 2. 获取部署脚本

编辑刚创建的站点，在「Push 心跳监控配置」区域可以看到：
- **上报地址**：`https://你的域名/api/push/你的Token`
- **部署脚本**：支持 Bash、Python、PowerShell、Node.js、cURL

### 3. 在主机上部署脚本

#### Linux/macOS (Bash)

```bash
# 1. 下载脚本
curl -o /usr/local/bin/heartbeat.sh "复制的脚本内容"

# 2. 添加执行权限
chmod +x /usr/local/bin/heartbeat.sh

# 3. 添加到 crontab（每分钟执行）
crontab -e
# 添加以下行：
# */1 * * * * /usr/local/bin/heartbeat.sh > /dev/null 2>&1
```

#### Windows (PowerShell)

1. 将脚本保存为 `C:\Scripts\heartbeat.ps1`
2. 打开「任务计划程序」
3. 创建基本任务，设置触发器为每分钟重复
4. 操作设置为运行 PowerShell 脚本

## 脚本示例

### 简单心跳（仅检测在线状态）

```bash
#!/bin/bash
curl -s -X POST "https://你的域名/api/push/你的Token"
```

### 完整系统信息上报

```bash
#!/bin/bash
# 获取系统指标
CPU=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1 2>/dev/null || echo "0")
MEM=$(free | awk '/Mem:/ {printf("%.1f", $3/$2 * 100)}' 2>/dev/null || echo "0")
DISK=$(df -h / | awk 'NR==2 {print $5}' | tr -d '%' 2>/dev/null || echo "0")
LOAD=$(cat /proc/loadavg | awk '{print $1}' 2>/dev/null || echo "0")
UPTIME=$(cat /proc/uptime | awk '{print int($1)}' 2>/dev/null || echo "0")

# 发送心跳
curl -s -X POST "https://你的域名/api/push/你的Token" \
  -H "Content-Type: application/json" \
  -d "{
    \"cpu\": $CPU,
    \"memory\": $MEM,
    \"disk\": $DISK,
    \"load\": $LOAD,
    \"uptime\": $UPTIME
  }"
```

### Python 版本

```python
#!/usr/bin/env python3
import urllib.request
import json
import os

def get_cpu():
    try:
        load = os.getloadavg()[0]
        cpu_count = os.cpu_count() or 1
        return round(load / cpu_count * 100, 1)
    except:
        return 0

def get_memory():
    try:
        with open('/proc/meminfo', 'r') as f:
            lines = f.readlines()
        total = int([l for l in lines if 'MemTotal' in l][0].split()[1])
        available = int([l for l in lines if 'MemAvailable' in l][0].split()[1])
        return round((total - available) / total * 100, 1)
    except:
        return 0

data = {'cpu': get_cpu(), 'memory': get_memory()}

req = urllib.request.Request(
    'https://你的域名/api/push/你的Token',
    data=json.dumps(data).encode('utf-8'),
    headers={'Content-Type': 'application/json'},
    method='POST'
)

urllib.request.urlopen(req, timeout=10)
```

## 支持的上报字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `cpu` | number | CPU 使用率 (0-100) |
| `memory` / `mem` / `ram` | number | 内存使用率 (0-100) |
| `disk` | number | 磁盘使用率 (0-100) |
| `load` | number | 系统负载（1分钟平均） |
| `uptime` | number | 系统运行时间（秒） |
| `temperature` / `temp` | number | CPU 温度（摄氏度） |
| `latency` | number | 自定义延迟值（毫秒） |
| `network` | object | 网络信息（自定义） |
| `custom` | object | 自定义数据（见下方详细说明） |

## 自定义字段（custom）

`custom` 字段支持上报任意自定义指标，每个字段可以是简单数值或对象形式：

### 简单数值
```json
{
  "custom": {
    "queue_size": 42,
    "workers": 8
  }
}
```

### 完整对象格式
```json
{
  "custom": {
    "gpu": {
      "value": 45,
      "label": "GPU",
      "unit": "%",
      "icon": "gpu",
      "color": "#8b5cf6",
      "showHistory": true
    }
  }
}
```

### 字段说明

| 属性 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `value` | number | ✅ | 数值 |
| `label` | string | ❌ | 显示名称，默认使用字段 key |
| `unit` | string | ❌ | 单位，如 `%`, `MB`, `°C` |
| `icon` | string | ❌ | 图标名称（见下方支持列表） |
| `color` | string | ❌ | 图表颜色，如 `#10b981` |
| `showHistory` | boolean | ❌ | 是否显示历史走势，默认 true |

### 支持的图标

**系统监控**: `cpu`, `memory`, `disk`, `storage`, `database`, `activity`, `load`, `temperature`, `gauge`

**GPU/显卡**: `gpu`, `graphics`, `vram`, `monitor`

**网络相关**: `network`, `wifi`, `signal`, `router`, `globe`, `upload`, `download`, `bandwidth`

**连接/用户**: `connections`, `users`, `user`, `sessions`, `online`

**服务器/设备**: `server`, `cloud`, `container`, `docker`, `laptop`, `smartphone`

**电源/能源**: `battery`, `power`, `energy`, `zap`, `bolt`

**散热/环境**: `fan`, `cooling`, `flame`, `droplet`, `humidity`, `wind`, `sun`, `moon`

**消息/队列**: `message`, `queue`, `bell`, `notification`, `send`

**状态/趋势**: `trend`, `chart`, `stats`, `eye`, `views`

### 完整示例

```bash
curl -X POST "https://你的域名/api/push/你的Token" \
  -H "Content-Type: application/json" \
  -d '{
    "cpu": 25.5,
    "memory": 60.2,
    "disk": 45.0,
    "custom": {
      "gpu": { 
        "value": 45, 
        "label": "GPU", 
        "unit": "%", 
        "icon": "gpu",
        "showHistory": true 
      },
      "connections": { 
        "value": 128, 
        "label": "连接数", 
        "icon": "users",
        "showHistory": true 
      },
      "download_speed": { 
        "value": 156.8, 
        "label": "下载速度", 
        "unit": "MB/s", 
        "icon": "download",
        "color": "#06b6d4"
      },
      "queue_size": 42
    }
  }'
```

## 常见问题

### Q: 心跳脚本运行了但显示离线？

1. 检查上报地址是否正确
2. 检查网络是否能访问 Worker
3. 确认 Token 没有被修改
4. 查看脚本输出是否有错误

### Q: 如何测试心跳是否正常？

```bash
# 直接运行脚本，查看返回结果
curl -v -X POST "https://你的域名/api/push/你的Token" \
  -H "Content-Type: application/json" \
  -d '{"cpu": 10}'

# 应返回类似：{"success":true,"message":"心跳已记录",...}
```

### Q: 超时时间设置多少合适？

建议设置为心跳间隔的 2-3 倍：
- 心跳每分钟 → 超时设置 3 分钟
- 心跳每 5 分钟 → 超时设置 10-15 分钟

### Q: 重新生成 Token 后需要做什么？

需要更新所有主机上的脚本，将旧 Token 替换为新 Token。旧 Token 会立即失效。

## API 接口

### 上报心跳

```
POST /api/push/:token
Content-Type: application/json

{
  "cpu": 25.5,
  "memory": 60.2,
  "disk": 45.0,
  "load": 1.2,
  "uptime": 86400
}
```

**响应**：
```json
{
  "success": true,
  "message": "心跳已记录",
  "timestamp": 1703145600000,
  "siteId": "site_xxx",
  "siteName": "我的NAS"
}
```

### 重新生成 Token（需要管理员权限）

```
POST /api/sites/:siteId/regenerate-token
Authorization: Bearer <token>
```

### 获取 Push 配置和脚本（需要管理员权限）

```
GET /api/sites/:siteId/push-config
Authorization: Bearer <token>
```
