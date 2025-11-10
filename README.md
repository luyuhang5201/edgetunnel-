# edgetunnel-（不太会用markdown所以写的格式比较烂）
基于源edgetunnel 的个人修改版，版权归原作者所有
## 新加入的 NAT64 转换功能主要用于在 IPv6-only 环境中处理 IPv4 目标地址的代理请求。它会自动将 IPv4 地址转换为嵌入 NAT64 前缀的 IPv6 地址，从而实现兼容性
1. 启用 NAT64 转换

通过路径参数触发：在 WebSocket 代理路径中使用 proxyip 参数（或其变体，如 pyip=、ip=）来启用。
基本格式：/proxyip=nat64（忽略大小写）。
这会启用 NAT64，并使用默认的 Well-Known NAT64 前缀 64:ff9b::（RFC 6052 标准前缀）。

自定义前缀：如果你有特定的 NAT64 前缀，可以在 nat64 后添加冒号（:）和前缀。
示例：/proxyip=nat64:2001:db8::（前缀会自动确保以 :: 结尾，如果没有会添加）。


注意：

启用后，原 proxyip 参数会被重置为 auto，因为 NAT64 不是实际的反代 IP，而是转换机制。
转换仅针对目标地址（host）是 IPv4 格式（如 8.8.8.8）时生效；如果是 IPv6 地址或域名，则不转换。
这个功能与 SOCKS5/HTTP 代理参数可以结合使用，但优先级是 proxyip 参数最高。

2. 使用示例

默认前缀示例：
假设你的 Workers URL 是 https://your-worker.example.com，要启用 NAT64：
访问路径：wss://your-worker.example.com/proxyip=nat64

如果目标 host 是 IPv4（如 192.0.2.1），它会被转换为 64:ff9b::c000:201。

自定义前缀示例：
访问路径：wss://your-worker.example.com/proxyip=nat64:2001:db8::
目标 IPv4 192.0.2.1 转换为 2001:db8::c000:201。

结合其他参数：
与 SOCKS5 结合：wss://your-worker.example.com/socks5=your-socks5-account/proxyip=nat64
这会先处理 SOCKS5 代理，然后在需要时应用 NAT64 转换。


3. 工作流程

当代理请求的目标是 IPv4 地址时，代码会自动检测并转换。
转换公式：将 IPv4 的四个字节转换为两个 16 进制块，并附加到前缀后。
示例计算：IPv4 192.0.2.1 → 第一部分 (192 << 8) | 0 = c000，第二部分 (2 << 8) | 1 = 0201 → 前缀:c000:0201。

适用于场景：如 Cloudflare Workers 等 IPv6 优先环境，帮助代理 IPv4 资源而无需额外配置。


# 注：此修改版本并没有直接进行的nat64转换功能
要直接使用 NAT64 转换功能，而不依赖路径中的 proxyip 参数（即不通过 /proxyip=nat64 等方式触发），则需要修改 Workers 脚本代码本身，使 NAT64 前缀成为一个固定配置或通过环境变量（env）动态设置。这样，无论请求路径如何，只要目标地址（host）是 IPv4 格式，代码都会自动应用转换

# step1：
## 通过修改 worker底部代码，在任何的逻辑之前添加 nat64Prefix = env.NAT64_PREFIX || '64:ff9b::';  // 从环境变量读取 NAT64 前缀，默认使用 Well-Known 前缀


/workdir/temp.js:1
nat64Prefix = env.NAT64_PREFIX || '64:ff9b::';  // 从环境变量读取 NAT64 前缀，默认使用 Well-Known 前缀
^

ReferenceError: env is not defined
    at Object.<anonymous> (/workdir/temp.js:1:1)
    at Module._compile (node:internal/modules/cjs/loader:1356:14)
    at Module._extensions..js (node:internal/modules/cjs/loader:1414:10)
    at Module.load (node:internal/modules/cjs/loader:1197:32)
    at Module._load (node:internal/modules/cjs/loader:1013:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:128:12)
    at node:internal/main/run_main_module:28:49

Node.js v18.19.1

## env.NAT64_PREFIX：从 Cloudflare Workers 的环境变量中读取自定义前缀（详见步骤 2）。如果未设置，则使用默认值 '64:ff9b::'（RFC 6052 标准 Well-Known 前缀）。
## 这会使 nat64Prefix 成为全局变量，并在 createConnection 函数中始终检查并应用转换（如果 host 是 IPv4）。
## 注意：前缀必须以 :: 结尾；如果自定义前缀没有，代码中已有逻辑会自动添加。
## 保存并部署，修改过的代码的createConnection函数会自动处理：
  如果 nat64Prefix 已设置且 host 是 IPv4（如 8.8.8.8），则转换为 IPv6（如 64:ff9b::808:808）。
  无需在请求路径中添加任何参数。


### 完整修改后的fetch函数开头示例哦（只需插入一行其他保持不变）：
  export default {
      async fetch(request, env) {
          nat64Prefix = env.NAT64_PREFIX || '64:ff9b::';  // 新增：直接启用 NAT64
          const url = new URL(request.url);
          // ... 其余代码不变
      }
  };

  # step2  配置环境变量，可选
  ## 如果你想动态自定义前缀（而不硬编码），使用 Cloudflare 的环境变量功能：
在 Workers 仪表板 > 选择你的 Worker > Settings > Variables & Secrets > Environment Variables > Add variable。
设置变量名：NAT64_PREFIX，值：你的自定义前缀（如 2001:db8::）。
保存并重新部署。

默认行为：如果未设置环境变量，则使用 '64:ff9b::'。
测试自定义：部署后，发送一个代理请求到 IPv4 目标，检查日志或连接是否使用转换后的 IPv6 地址。


# step3：测试
不带任何路径参数：直接使用你的 Workers URL，如 wss://your-worker.example.com/。
发送代理请求：在客户端（如 v2rayN 或 Clash）配置节点，使用 Workers URL 作为服务器地址。
测试目标：连接到一个 IPv4-only 服务，如 8.8.8.8:53（Google DNS）。
预期：代码会自动转换为 64:ff9b::808:808:53（或你的自定义前缀），并尝试连接。

验证：
在 Workers 仪表板 > Logs 查看控制台输出（添加 console.log('Using NAT64 for host:', host); 到 createConnection 函数以调试）。
如果连接失败，检查网络是否支持该 NAT64 前缀（e.g., 测试 ping6 64:ff9b::808:808 在你的环境中）。


### tip：
兼容性：NAT64 需要你的网络环境支持 IPv6 路由和 NAT64 网关（如某些云提供商或 IPv6-only 网络）。如果前缀无效，连接会失败。
不影响其他：这不会改变 SOCKS5/HTTP 代理或其他功能；只针对 IPv4 目标 host 生效。
回滚：如果不需要，直接删除新增的那一行代码。
高级：如果你想让 NAT64 可选（而非始终启用），可以添加一个新路径参数，如 /nat64=prefix，并在 反代参数获取 函数中类似处理（类似于 proxyip 的逻辑）。

目前的使用方法需要指定一个nat64前缀而不是一个完整的转换地址，因为nat64转换的核心就是把ipv4的地址嵌入到一个ipv6的前缀中，形成可路由的ip地址

1. NAT64 前缀的作用

NAT64 前缀是一个 IPv6 前缀（通常 96 位或更短），用于将 IPv4 地址转换为 IPv6 地址。
示例：默认前缀 64:ff9b::（Well-Known NAT64 前缀，RFC 6052 标准），将 IPv4 8.8.8.8 转换为 64:ff9b::808:808。
这个前缀不是一个“服务器地址”，而是一个网络配置参数。它需要匹配你的实际网络环境（比如你的 ISP 或云提供商的 NAT64 网关前缀），否则转换后的地址无法路由，连接会失败。

2. 是否必须提供

默认情况：代码中内置了默认前缀 64:ff9b::，所以如果你不指定，自带这个就够用了（适合大多数测试环境）。
自定义情况：如果你的网络使用不同的前缀（如企业或特定云环境的 2001:db8::），则需要提供，否则默认的可能不工作。
何时需要：在 IPv6-only 环境中（如某些 Cloudflare 部署或移动网络），如果目标是 IPv4 地址，没有前缀就无法连接 IPv4 资源。所以，是的，通常需要一个有效的前缀。

3. 如何提供和使用

通过路径参数（原版方式，不改代码）：
启用默认前缀：/proxyip=nat64（使用 64:ff9b::）。
指定自定义前缀：/proxyip=nat64:2001:db8::（代码会自动补全为 2001:db8::）。
示例 URL：wss://your-worker.example.com/proxyip=nat64:2001:db8::。

通过环境变量（全局启用，无需路径参数）：
在 Cloudflare Workers 设置中添加环境变量 NAT64_PREFIX，值为你的前缀（如 2001:db8::）。
代码会自动读取并应用，无需额外路径。所有 IPv4 目标都会转换。

测试步骤：
配置节点（e.g., 在 Clash 或 v2rayN 中设置 Workers URL）。
尝试连接 IPv4 目标（如 ping 8.8.8.8 或访问 IPv4-only 网站）。
检查 Workers 日志：添加 console.log('Converted host:', host); 到 createConnection 函数，查看是否转换成功。


4. 获取有效前缀

默认推荐：用 64:ff9b::，测试是否在你的网络中工作（e.g., ping6 64:ff9b::808:808）。
自定义来源：
查询你的网络提供商（ISP）或云平台文档（e.g., AWS、Google Cloud 的 NAT64 配置）。
如果是 DNS64 环境，用工具如 dig AAAA example.com 检查返回的地址前缀。

注意：无效前缀会导致连接超时。建议先在终端测试转换后的地址。

如果你的环境不是 IPv6-only，这个功能可选；否则，它是必需的。



## DNS64与nat64的结合
1.dns64和nat64 
  NAT64（Network Address Translation 64）：一种状态ful 的网络地址转换技术，将 IPv6 地址转换为 IPv4 地址（反之亦然）。它在网络层（Layer 3）处理数据包的翻译，通常部署在网关服务器上。
  DNS64（DNS 64）：一种 DNS 扩展机制，用于将 IPv4 A 记录（IPv4 地址）合成 IPv6 AAAA 记录（IPv6 地址）。它不处理实际流量，仅处理 DNS 查询响应。  

NAT64 和 DNS64 必须结合使用：DNS64 负责“欺骗” IPv6 客户端提供一个合成的 IPv6 地址，NAT64 则负责实际的流量翻译。如果缺少 DNS64，IPv6 客户端无法获取有效的 IPv6 地址；如果缺少 NAT64，流量无法路由到 IPv4 服务器。


2. 结合工作原理
DNS64 和 NAT64 的结合允许 IPv6-only 环境无缝访问 IPv4 资源。以下是典型流程：

DNS 查询：IPv6-only 客户端查询域名（如 example.com），该域名仅有 IPv4 A 记录（例如 185.130.44.9）。
DNS64 处理：DNS64 服务器拦截查询。如果域名没有原生 AAAA 记录，DNS64 会合成一个：
将 IPv4 地址转换为 16 进制（例如 185.130.44.9 → b9822c09）。
使用预定义的 NAT64 前缀（通常是 Well-Known 前缀 64:ff9b::/96）嵌入该地址，形成合成 IPv6 地址（如 64:ff9b::b982:2c09）。
返回这个合成 AAAA 记录给客户端。

客户端连接：客户端使用合成 IPv6 地址发起连接（例如 ping6 64:ff9b::185.130.44.9）。
NAT64 翻译：
数据包到达 NAT64 网关。
NAT64 从合成 IPv6 地址中提取原 IPv4 地址（去除前缀 64:ff9b::/96）。
将 IPv6 数据包转换为 IPv4 数据包，并转发到实际 IPv4 服务器。

响应处理：
IPv4 服务器响应给 NAT64 网关。
NAT64 将 IPv4 响应转换为 IPv6（使用相同的合成地址），并发送回 IPv6 客户端。


这个过程是透明的，客户端无需感知 IPv4 的存在。NAT64 维护状态表（stateful），确保会话一致性。

3. 示例

域名解析示例：
客户端查询 example.com（IPv4: 185.130.44.9）。
DNS64 返回 64:ff9b::b982:2c09（或等价的 64:ff9b::185.130.44.9）。
客户端连接到这个 IPv6 地址，NAT64 翻译为 185.130.44.9。

Google DNS 示例：
IPv4: 8.8.8.8 → 合成 IPv6: 64:ff9b::808:808。
命令测试：ping6 64:ff9b::8.8.8.8（在支持 NAT64 的环境中）。

实际场景：在 AWS VPC 或 Google Cloud 中，启用 DNS64 策略后，IPv6-only EC2 实例可以访问 IPv4-only 外部服务。

4. 益处

IPv6 过渡：帮助组织从 IPv4 迁移到 IPv6，而无需立即升级所有 IPv4-only 服务。
地址节约：减少对稀缺 IPv4 地址的需求，支持 IPv6-only 客户端访问遗留 IPv4 资源。
无缝兼容：对客户端透明，无需修改应用代码；适用于数据中心、企业网络和云环境。
灵活性：可与双栈（dual-stack）环境结合，但需注意避免不必要的 NAT64 流量（如 Reddit 讨论的双栈主机交互）。
安全性：NAT64 提供状态ful 翻译，类似于 NAT44 的防火墙效果。


5. 配置提示

前缀选择：默认使用 64:ff9b::/96。自定义前缀（如 2a07:e01:ffff:ff::/96）需确保 DNS64 和 NAT64 一致，否则仅限于内部使用。
工具实现：
Linux (Tayga)：安装 tayga，配置 /etc/tayga.conf（设置 IPv4/IPv6 地址、前缀），启用 IP 转发，重启服务。添加路由：ip -6 route add 64:ff9b::/96 via <NAT64 IPv6 地址>。
Cisco/Juniper：配置 NAT64 池和 DNS64 服务器（如 Cisco ASR 或 Juniper SRX）。示例命令：ipv6 route 64:ff9b::/96 <NAT64 IPv6>。

测试：使用 ping6、mtr 或 curl 测试合成地址。确保 DNS 服务器支持 DNS64（e.g., BIND、Unbound）。
潜在问题：在双栈环境中，优先 IPv6 可能绕过 NAT64；自定义前缀需内部 DNS64 支持。

后续会更新
  
