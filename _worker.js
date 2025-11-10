import { connect } from "cloudflare:sockets";
let config_JSON, 反代IP = '', 启用SOCKS5反代 = null, 启用SOCKS5全局反代 = false, 我的SOCKS5账号 = '', parsedSocks5Address = {};
let SOCKS5白名单 = ['*tapecontent.net', '*cloudatacdn.com', '*loadshare.org', '*cdn-centaurus.com', 'scholar.google.com'];
const Pages静态页面 = 'https://edt-pages.github.io';
const KEEPALIVE = 15000, STALL_TIMEOUT = 8000, MAX_STALL = 12, MAX_RECONNECT = 24;
let nat64Prefix = null; // 新增：NAT64前缀，默认为null
///////////////////////////////////////////////////////主程序入口///////////////////////////////////////////////
export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        const UA = request.headers.get('User-Agent') || 'null';
        const upgradeHeader = request.headers.get('Upgrade');
        const 管理员密码 = env.ADMIN || env.admin || env.UUID || env.uuid || env.PASSWORD || env.password || env.pswd || env.TOKEN || env.KEY;
        const 加密秘钥 = env.KEY || '勿动此默认密钥，有需求请自行通过添加变量KEY进行修改';
        const userIDMD5 = await MD5MD5(管理员密码 + 加密秘钥);
        const userID = [userIDMD5.slice(0, 8), userIDMD5.slice(8, 12), '4' + userIDMD5.slice(13, 16), userIDMD5.slice(16, 20), userIDMD5.slice(20)].join('-');
        反代IP = 反代IP ? 反代IP : request.cf.colo + '.PrOxYIp.CmLiUsSsS.nEt';
        const 访问IP = request.headers.get('X-Real-IP') || request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || request.headers.get('True-Client-IP') || request.headers.get('Fly-Client-IP') || request.headers.get('X-Appengine-Remote-Addr') || request.headers.get('X-Forwarded-For') || request.headers.get('X-Real-IP') || request.headers.get('X-Cluster-Client-IP') || request.cf?.clientTcpRtt || '未知IP';
        if (env.GO2SOCKS5) SOCKS5白名单 = await 整理成数组(env.GO2SOCKS5);
        if (!upgradeHeader || upgradeHeader !== 'websocket') {
            if (!管理员密码) return fetch(Pages静态页面 + '/noADMIN').then(r => { const headers = new Headers(r.headers); headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate'); headers.set('Pragma', 'no-cache'); headers.set('Expires', '0'); return new Response(r.body, { status: 404, statusText: r.statusText, headers }); });
            if (!env.KV) return fetch(Pages静态页面 + '/noKV').then(r => { const headers = new Headers(r.headers); headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate'); headers.set('Pragma', 'no-cache'); headers.set('Expires', '0'); return new Response(r.body, { status: 404, statusText: r.statusText, headers }); });
            const 访问路径 = url.pathname.slice(1).toLowerCase();
            const 区分大小写访问路径 = url.pathname.slice(1);
            if (访问路径 === 加密秘钥 && 加密秘钥 !== '勿动此默认密钥，有需求请自行通过添加变量KEY进行修改') {//快速订阅
                return new Response('重定向中...', { status: 302, headers: { 'Location': `/sub?token=${await MD5MD5(url.host + userID)}` } });
            } else if (访问路径 === 'login') {//处理登录页面和登录请求
                const cookies = request.headers.get('Cookie') || '';
                const authCookie = cookies.split(';').find(c => c.trim().startsWith('auth='))?.split('=')[1];
                if (authCookie == await MD5MD5(UA + 加密秘钥 + 管理员密码)) return new Response('重定向中...', { status: 302, headers: { 'Location': '/admin' } });
                if (request.method === 'POST') {
                    const formData = await request.text();
                    const params = new URLSearchParams(formData);
                    const 输入密码 = params.get('password');
                    if (输入密码 === 管理员密码) {
                        // 密码正确，设置cookie并返回成功标记
                        const 响应 = new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json;charset=utf-8' } });
                        响应.headers.set('Set-Cookie', `auth=${await MD5MD5(UA + 加密秘钥 + 管理员密码)}; Path=/; Max-Age=86400; HttpOnly`);
                        return 响应;
                    }
                }
                return fetch(Pages静态页面 + '/login');
            } else if (访问路径.startsWith('admin')) {//验证cookie后响应管理页面
                const cookies = request.headers.get('Cookie') || '';
                const authCookie = cookies.split(';').find(c => c.trim().startsWith('auth='))?.split('=')[1];
                // 没有cookie或cookie错误，跳转到/login页面
                if (!authCookie || authCookie !== await MD5MD5(UA + 加密秘钥 + 管理员密码)) return new Response('重定向中...', { status: 302, headers: { 'Location': '/login' } });
                if (访问路径 === 'admin/log.json') {// 读取日志内容
                    const 读取日志内容 = await env.KV.get('log.json') || '[]';
                    return new Response(读取日志内容, { status: 200, headers: { 'Content-Type': 'application/json;charset=utf-8' } });
                } else if (区分大小写访问路径 === 'admin/getCloudflareUsage') {// 查询请求量
                    try {
                        const Usage_JSON = await getCloudflareUsage(url.searchParams.get('Email'), url.searchParams.get('GlobalAPIKey'), url.searchParams.get('AccountID'), url.searchParams.get('APIToken'));
                        return new Response(JSON.stringify(Usage_JSON, null, 2), { status: 200, headers: { 'Content-Type': 'application/json' } });
                    } catch (err) {
                        const errorResponse = { msg: '查询请求量失败，失败原因：' + err.message, error: err.message };
                        return new Response(JSON.stringify(errorResponse, null, 2), { status: 500, headers: { 'Content-Type': 'application/json;charset=utf-8' } });
                    }
                } else if (区分大小写访问路径 === 'admin/getADDAPI') {// 验证优选API
                    if (url.searchParams.get('url')) {
                        const 待验证优选URL = url.searchParams.get('url');
                        try {
                            new URL(待验证优选URL);
                            const 优选API的IP = await 请求优选API([待验证优选URL], url.searchParams.get('port') || '443');
                            return new Response(JSON.stringify({ success: true, data: 优选API的IP }, null, 2), { status: 200, headers: { 'Content-Type': 'application/json;charset=utf-8' } });
                        } catch (err) {
                            const errorResponse = { msg: '验证优选API失败，失败原因：' + err.message, error: err.message };
                            return new Response(JSON.stringify(errorResponse, null, 2), { status: 500, headers: { 'Content-Type': 'application/json;charset=utf-8' } });
                        }
                    }
                    return new Response(JSON.stringify({ success: false, data: [] }, null, 2), { status: 403, headers: { 'Content-Type': 'application/json;charset=utf-8' } });
                } else if (访问路径 === 'admin/check') {// SOCKS5代理检查
                    let 检测代理响应;
                    if (url.searchParams.has('socks5')) {
                        检测代理响应 = await SOCKS5可用性验证('socks5', url.searchParams.get('socks5'));
                    } else if (url.searchParams.has('http')) {
                        检测代理响应 = await SOCKS5可用性验证('http', url.searchParams.get('http'));
                    } else {
                        return new Response(JSON.stringify({ error: '缺少代理参数' }), { status: 400, headers: { 'Content-Type': 'application/json;charset=utf-8' } });
                    }
                    return new Response(JSON.stringify(检测代理响应, null, 2), { status: 200, headers: { 'Content-Type': 'application/json;charset=utf-8' } });
                }

                config_JSON = await 读取config_JSON(env, url.host, userID);

                if (访问路径 === 'admin/init') {// 重置配置为默认值
                    try {
                        config_JSON = await 读取config_JSON(env, url.host, userID, true);
                        await 请求日志记录(env, request, 访问IP, 'Init_Config', config_JSON);
                        config_JSON.init = '配置已重置为默认值';
                        return new Response(JSON.stringify(config_JSON, null, 2), { status: 200, headers: { 'Content-Type': 'application/json;charset=utf-8' } });
                    } catch (err) {
                        const errorResponse = { msg: '配置重置失败，失败原因：' + err.message, error: err.message };
                        return new Response(JSON.stringify(errorResponse, null, 2), { status: 500, headers: { 'Content-Type': 'application/json;charset=utf-8' } });
                    }
                } else if (request.method === 'POST') {// 处理 KV 操作（POST 请求）
                    if (访问路径 === 'admin/config.json') { // 保存config.json配置
                        try {
                            const newConfig = await request.json();
                            // 验证配置完整性
                            if (!newConfig.UUID || !newConfig.HOST) return new Response(JSON.stringify({ error: '配置不完整' }), { status: 400, headers: { 'Content-Type': 'application/json;charset=utf-8' } });

                            // 保存到 KV
                            await env.KV.put('config.json', JSON.stringify(newConfig, null, 2));
                            await 请求日志记录(env, request, 访问IP, 'Save_Config', config_JSON);
                            return new Response(JSON.stringify({ success: true, message: '配置已保存' }), { status: 200, headers: { 'Content-Type': 'application/json;charset=utf-8' } });
                        } catch (error) {
                            console.error('保存配置失败:', error);
                            return new Response(JSON.stringify({ error: '保存配置失败: ' + error.message }), { status: 500, headers: { 'Content-Type': 'application/json;charset=utf-8' } });
                        }
                    } else if (访问路径 === 'admin/cf.json') { // 保存cf.json配置
                        try {
                            const newConfig = await request.json();
                            const CF_JSON = { Email: null, GlobalAPIKey: null, AccountID: null, APIToken: null };
                            if (!newConfig.init || newConfig.init !== true) {
                                if (newConfig.Email && newConfig.GlobalAPIKey) {
                                    CF_JSON.Email = newConfig.Email;
                                    CF_JSON.GlobalAPIKey = newConfig.GlobalAPIKey;
                                    CF_JSON.AccountID = null;
                                    CF_JSON.APIToken = null;
                                } else if (newConfig.AccountID && newConfig.APIToken) {
                                    CF_JSON.Email = null;
                                    CF_JSON.GlobalAPIKey = null;
                                    CF_JSON.AccountID = newConfig.AccountID;
                                    CF_JSON.APIToken = newConfig.APIToken;
                                } else {
                                    return new Response(JSON.stringify({ error: '配置不完整' }), { status: 400, headers: { 'Content-Type': 'application/json;charset=utf-8' } });
                                }
                            }

                            // 保存到 KV
                            await env.KV.put('cf.json', JSON.stringify(CF_JSON, null, 2));
                            await 请求日志记录(env, request, 访问IP, 'Save_Config', config_JSON);
                            return new Response(JSON.stringify({ success: true, message: '配置已保存' }), { status: 200, headers: { 'Content-Type': 'application/json;charset=utf-8' } });
                        } catch (error) {
                            console.error('保存配置失败:', error);
                            return new Response(JSON.stringify({ error: '保存配置失败: ' + error.message }), { status: 500, headers: { 'Content-Type': 'application/json;charset=utf-8' } });
                        }
                    } else if (访问路径 === 'admin/tg.json') { // 保存tg.json配置
                        try {
                            const newConfig = await request.json();
                            if (newConfig.init && newConfig.init === true) {
                                const TG_JSON = { BotToken: null, ChatID: null };
                                await env.KV.put('tg.json', JSON.stringify(TG_JSON, null, 2));
                            } else {
                                if (!newConfig.BotToken || !newConfig.ChatID) return new Response(JSON.stringify({ error: '配置不完整' }), { status: 400, headers: { 'Content-Type': 'application/json;charset=utf-8' } });
                                await env.KV.put('tg.json', JSON.stringify(newConfig, null, 2));
                            }
                            await 请求日志记录(env, request, 访问IP, 'Save_Config', config_JSON);
                            return new Response(JSON.stringify({ success: true, message: '配置已保存' }), { status: 200, headers: { 'Content-Type': 'application/json;charset=utf-8' } });
                        } catch (error) {
                            console.error('保存配置失败:', error);
                            return new Response(JSON.stringify({ error: '保存配置失败: ' + error.message }), { status: 500, headers: { 'Content-Type': 'application/json;charset=utf-8' } });
                        }
                    } else if (区分大小写访问路径 === 'admin/ADD.txt') { // 保存自定义优选IP
                        try {
                            const customIPs = await request.text();
                            await env.KV.put('ADD.txt', customIPs);// 保存到 KV
                            await 请求日志记录(env, request, 访问IP, 'Save_Custom_IPs', config_JSON);
                            return new Response(JSON.stringify({ success: true, message: '自定义IP已保存' }), { status: 200, headers: { 'Content-Type': 'application/json;charset=utf-8' } });
                        } catch (error) {
                            console.error('保存自定义IP失败:', error);
                            return new Response(JSON.stringify({ error: '保存自定义IP失败: ' + error.message }), { status: 500, headers: { 'Content-Type': 'application/json;charset=utf-8' } });
                        }
                    } else return new Response(JSON.stringify({ error: '不支持的POST请求路径' }), { status: 404, headers: { 'Content-Type': 'application/json;charset=utf-8' } });
                } else if (访问路径 === 'admin/config.json') {// 处理 admin/config.json 请求，返回JSON
                    return new Response(JSON.stringify(config_JSON, null, 2), { status: 200, headers: { 'Content-Type': 'application/json' } });
                } else if (区分大小写访问路径 === 'admin/ADD.txt') {// 处理 admin/ADD.txt 请求，返回本地优选IP
                    let 本地优选IP = await env.KV.get('ADD.txt') || 'null';
                    if (本地优选IP == 'null') 本地优选IP = (await 生成随机IP(request, config_JSON.优选订阅生成.本地IP库.随机数量))[1];
                    return new Response(本地优选IP, { status: 200, headers: { 'Content-Type': 'text/plain;charset=utf-8', 'asn': request.cf.asn } });
                } else if (访问路径 === 'admin/cf.json') {// CF配置文件
                    return new Response(JSON.stringify(request.cf, null, 2), { status: 200, headers: { 'Content-Type': 'application/json;charset=utf-8' } });
                }

                await 请求日志记录(env, request, 访问IP, 'Admin_Login', config_JSON);
                return fetch(Pages静态页面 + '/admin');
            } else if (访问路径 === 'logout') {//清除cookie并跳转到登录页面
                const 响应 = new Response('重定向中...', { status: 302, headers: { 'Location': '/login' } });
                响应.headers.set('Set-Cookie', 'auth=; Path=/; Max-Age=0; HttpOnly');
                return 响应;
            } else if (访问路径 === 'sub') {//处理订阅请求
                const 订阅TOKEN = await MD5MD5(url.host + userID);
                if (url.searchParams.get('token') === 订阅TOKEN) {
                    config_JSON = await 读取config_JSON(env, url.host, userID);
                    await 请求日志记录(env, request, 访问IP, 'Get_SUB', config_JSON);
                    const ua = UA.toLowerCase();
                    const expire = 4102329600;//2099-12-31 到期时间
                    const now = Date.now();
                    const today = new Date(now);
                    today.setHours(0, 0, 0, 0);
                    const UD = Math.floor(((now - today.getTime()) / 86400000) * 24 * 1099511627776 / 2);
                    let pagesSum = UD, workersSum = UD, total = 24 * 1099511627776;
                    if (config_JSON.CF.Usage.success) {
                        pagesSum = config_JSON.CF.Usage.pages;
                        workersSum = config_JSON.CF.Usage.workers;
                        total = 1024 * 100;
                    }
                    const responseHeaders = {
                        "content-type": "text/plain; charset=utf-8",
                        "Profile-Update-Interval": config_JSON.优选订阅生成.SUBUpdateTime,
                        "Profile-web-page-url": url.protocol + '//' + url.host + '/admin',
                        "Subscription-Userinfo": `upload=${pagesSum}; download=${workersSum}; total=${total}; expire=${expire}`,
                        "Cache-Control": "no-store",
                    };
                    const isSubConverterRequest = request.headers.has('b64') || request.headers.has('base64') || request.headers.get('subconverter-request') || request.headers.get('subconverter-version') || ua.includes('subconverter') || ua.includes(('CF-Workers-SUB').toLowerCase());
                    const 订阅类型 = isSubConverterRequest
                        ? 'mixed'
                        : url.searchParams.has('target')
                            ? url.searchParams.get('target')
                            : url.searchParams.has('clash') || ua.includes('clash') || ua.includes('meta') || ua.includes('mihomo')
                                ? 'clash'
                                : url.searchParams.has('sb') || url.searchParams.has('singbox') || ua.includes('singbox') || ua.includes('sing-box')
                                    ? 'singbox'
                                    : url.searchParams.has('surge') || ua.includes('surge')
                                        ? 'surge&ver=4'
                                        : 'mixed';

                    if (!ua.includes('mozilla')) responseHeaders["Content-Disposition"] = `attachment; filename*=utf-8''${encodeURIComponent(config_JSON.优选订阅生成.SUBNAME)}`;
                    const 协议类型 = (url.searchParams.has('surge') || ua.includes('surge')) ? 'tro' + 'jan' : config_JSON.协议类型;
                    let 订阅内容 = '';
                    if (订阅类型 === 'mixed') {
                        if (!url.searchParams.has('sub') && config_JSON.优选订阅生成.local) { // 本地生成订阅
                            const 完整优选列表 = config_JSON.优选订阅生成.本地IP库.随机IP ? (await 生成随机IP(request, config_JSON.优选订阅生成.本地IP库.随机数量))[0] : await env.KV.get('ADD.txt') ? await 整理成数组(await env.KV.get('ADD.txt')) : (await 生成随机IP(request, config_JSON.优选订阅生成.本地IP库.随机数量))[0];
                            const 优选API = [], 优选IP = [];
                            for (const 元素 of 完整优选列表) {
                                if (元素.toLowerCase().startsWith('https://') || 元素.toLowerCase().startsWith('http://')) 优选API.push(元素);
                                else 优选IP.push(元素);
                            }
                            const 优选API的IP = await 请求优选API(优选API);
                            const 完整优选IP = [...new Set(优选IP.concat(优选API的IP))];
                            订阅内容 = 完整优选IP.map(原始地址 => {
                                // 统一正则: 匹配 域名/IPv4/IPv6地址 + 可选端口 + 可选备注
                                // 示例: 
                                //   - 域名: hj.xmm1993.top:2096#备注 或 example.com
                                //   - IPv4: 166.0.188.128:443#Los Angeles 或 166.0.188.128
                                //   - IPv6: [2606:4700::]:443#CMCC 或 [2606:4700::]
                                const regex = /^(\[[\da-fA-F:]+\]|[\d.]+|[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?)*)(?::(\d+))?(?:#(.+))?$/;
                                const match = 原始地址.match(regex);

                                let 节点地址, 节点端口 = "443", 节点备注;

                                if (match) {
                                    节点地址 = match[1];  // IP地址或域名(可能带方括号)
                                    节点端口 = match[2] || "443";  // 端口,默认443
                                    节点备注 = match[3] || 节点地址;  // 备注,默认为地址本身
                                } else {
                                    // 兜底处理:无法匹配时使用原始地址
                                    节点地址 = 原始地址;
                                    节点备注 = 原始地址;
                                }

                                return `${协议类型}://${config_JSON.UUID}@${节点地址}:${节点端口}?security=tls&type=${config_JSON.传输协议}&host=${config_JSON.HOST}&sni=${config_JSON.HOST}&path=${encodeURIComponent(config_JSON.PATH)}&fragment=${encodeURIComponent('1,40-60,30-50,tlshello')}&encryption=none${config_JSON.跳过证书验证 ? '&allowInsecure=1' : ''}#${encodeURIComponent(节点备注)}`;
                            }).join('\n');
                            订阅内容 = btoa(订阅内容);
                        } else { // 优选订阅生成器
                            let 优选订阅生成器HOST = url.searchParams.get('sub') || config_JSON.优选订阅生成.SUB;
                            优选订阅生成器HOST = 优选订阅生成器HOST && !/^https?:\/\//i.test(优选订阅生成器HOST) ? `https://${优选订阅生成器HOST}` : 优选订阅生成器HOST;
                            const 优选订阅生成器URL = `${优选订阅生成器HOST}/sub?host=example.com&${协议类型 === ('v' + 'le' + 'ss') ? 'uuid' : 'pw'}=00000000-0000-4000-0000-000000000000&path=${encodeURIComponent(config_JSON.PATH)}&type=${config_JSON.传输协议}`;
                            try {
                                const response = await fetch(优选订阅生成器URL, { headers: { 'User-Agent': 'v2rayN/edge' + 'tunnel (https://github.com/cmliu/edge' + 'tunnel)' } });
                                if (response.ok) 订阅内容 = await response.text();
                                else return new Response('优选订阅生成器异常：' + response.statusText, { status: response.status });
                            } catch (error) {
                                return new Response('优选订阅生成器异常：' + error.message, { status: 403 });
                            }
                        }
                    } else { // 订阅转换
                        const 订阅转换URL = `${config_JSON.订阅转换配置.SUBAPI}/sub?target=${订阅类型}&url=${encodeURIComponent(url.protocol + '//' + url.host + '/sub?target=mixed&token=' + 订阅TOKEN) + (url.searchParams.has('sub') && url.searchParams.get('sub') != '' ? `&sub=${url.searchParams.get('sub')}` : '')}&config=${encodeURIComponent(config_JSON.订阅转换配置.SUBCONFIG)}&emoji=${config_JSON.订阅转换配置.SUBEMOJI}&scv=${config_JSON.跳过证书验证}`;
                        try {
                            const response = await fetch(订阅转换URL, { headers: { 'User-Agent': 'Subconverter for ' + 订阅类型 + ' edge' + 'tunnel(https://github.com/cmliu/edge' + 'tunnel)' } });
                            if (response.ok) {
                                订阅内容 = await response.text();
                                if (url.searchParams.has('surge') || ua.includes('surge')) 订阅内容 = surge(订阅内容, url.protocol + '//' + url.host + '/sub?token=' + 订阅TOKEN + '&surge', config_JSON);
                            } else return new Response('订阅转换后端异常：' + response.statusText, { status: response.status });
                        } catch (error) {
                            return new Response('订阅转换后端异常：' + error.message, { status: 403 });
                        }
                    }
                    if (订阅类型 === 'mixed') {
                        订阅内容 = atob(订阅内容).replace(/example.com/g, config_JSON.HOST).replace(/00000000-0000-4000-0000-000000000000/g, config_JSON.UUID);
                        if (!ua.includes('mozilla')) 订阅内容 = btoa(订阅内容);
                    } else 订阅内容 = 订阅内容.replace(/example.com/g, config_JSON.HOST).replace(/00000000-0000-4000-0000-000000000000/g, config_JSON.UUID);
                    return new Response(订阅内容, { status: 200, headers: responseHeaders });
                }
                return new Response('无效的订阅TOKEN', { status: 403 });
            }

            let 伪装页URL = env.URL || 'nginx';
            if (伪装页URL && 伪装页URL !== 'nginx' && 伪装页URL !== '1101') {
                伪装页URL = 伪装页URL.trim().replace(/\/$/, '');
                if (!伪装页URL.match(/^https?:\/\//i)) 伪装页URL = 'https://' + 伪装页URL;
                if (伪装页URL.toLowerCase().startsWith('http://')) 伪装页URL = 'https://' + 伪装页URL.substring(7);
                try { const u = new URL(伪装页URL); 伪装页URL = u.protocol + '//' + u.host; } catch (e) { 伪装页URL = 'nginx'; }
            }
            if (伪装页URL === '1101') return new Response(await html1101(url.host, 访问IP), { status: 200, headers: { 'Content-Type': 'text/html; charset=UTF-8' } });
            try {
                const 反代URL = new URL(伪装页URL), 新请求头 = new Headers(request.headers);
                新请求头.set('Host', 反代URL.host);
                if (新请求头.has('Referer')) { const u = new URL(新请求头.get('Referer')); 新请求头.set('Referer', 反代URL.protocol + '//' + 反代URL.host + u.pathname + u.search); }
                if (新请求头.has('Origin')) 新请求头.set('Origin', 反代URL.protocol + '//' + 反代URL.host);
                if (!新请求头.has('User-Agent') && UA && UA !== 'null') 新请求头.set('User-Agent', UA);
                return fetch(new Request(反代URL.protocol + 反代URL.host + url.pathname + url.search, { method: request.method, headers: 新请求头, body: request.body, cf: request.cf }));
            } catch (error) { }
            return new Response(await nginx(), { status: 200, headers: { 'Content-Type': 'text/html; charset=UTF-8' } });
        } else {// ws代理
            await 反代参数获取(request);
            const { 0: client, 1: server } = new WebSocketPair();
            server.accept();
            handleConnection(server, request, userID);
            return new Response(null, { status: 101, webSocket: client });
        }
    }
};
///////////////////////////////////////////////////////////////////////WS传输数据///////////////////////////////////////////////
function handleConnection(ws, request, FIXED_UUID) {
    let socket, writer, reader, info;
    let isFirstMsg = true, bytesReceived = 0, stallCount = 0, reconnectCount = 0;
    let lastData = Date.now();
    const timers = {};
    const dataBuffer = [];
    const earlyDataHeader = request.headers.get("sec-websocket-protocol") || "";
    async function 处理魏烈思握手(data) {
        const bytes = new Uint8Array(data);
        ws.send(new Uint8Array([bytes[0], 0]));
        if (Array.from(bytes.slice(1, 17)).map(n => n.toString(16).padStart(2, '0')).join('').replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5') !== FIXED_UUID) throw new Error('Auth failed');
        const offset1 = 18 + bytes[17] + 1;
        const port = (bytes[offset1] << 8) | bytes[offset1 + 1];
        const addrType = bytes[offset1 + 2];
        const offset2 = offset1 + 3;
        const { host, length } = parseAddress(bytes, offset2, addrType === 1 ? 1 : addrType === 2 ? 2 : 4);
        const payload = bytes.slice(length);
        if (host.includes(atob('c3BlZWQuY2xvdWRmbGFyZS5jb20='))) throw new Error('Access');
        const sock = await createConnection(host, port);
        await sock.opened;
        const w = sock.writable.getWriter();
        if (payload.length) await w.write(payload);
        return { socket: sock, writer: w, reader: sock.readable.getReader(), info: { host, port } };
    }

    async function 处理木马握手(data) {
        const bytes = new Uint8Array(data);
        if (bytes.byteLength < 56 || bytes[56] !== 0x0d || bytes[57] !== 0x0a) throw new Error("invalid data or header format");
        if (new TextDecoder().decode(bytes.slice(0, 56)) !== sha224(FIXED_UUID)) throw new Error("invalid password");

        const socks5Data = bytes.slice(58);
        if (socks5Data.byteLength < 6) throw new Error("invalid SOCKS5 request data");
        if (socks5Data[0] !== 1) throw new Error("unsupported command, only TCP (CONNECT) is allowed");

        const { host, length } = parseAddress(socks5Data, 2, socks5Data[1]);
        if (!host) throw new Error(`address is empty, addressType is ${socks5Data[1]}`);
        if (host.includes(atob('c3BlZWQuY2xvdWRmbGFyZS5jb20='))) throw new Error('Access');

        const port = (socks5Data[length] << 8) | socks5Data[length + 1];
        const sock = await createConnection(host, port);
        await sock.opened;
        const w = sock.writable.getWriter();
        const payload = socks5Data.slice(length + 4);
        if (payload.length) await w.write(payload);
        return { socket: sock, writer: w, reader: sock.readable.getReader(), info: { host, port } };
    }

    async function createConnection(host, port) {
        // 新增：如果启用NAT64且host是IPv4地址，则转换为NAT64 IPv6地址
        if (nat64Prefix && /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)) {
            host = ipv4ToNat64(host, nat64Prefix);
        }
        async function useSocks5Pattern(address) {
            return SOCKS5白名单.some(pattern => {
                let regexPattern = pattern.replace(/\*/g, '.*');
                let regex = new RegExp(`^${regexPattern}$`, 'i');
                return regex.test(address);
            });
        }
        启用SOCKS5全局反代 = (await useSocks5Pattern(host)) || 启用SOCKS5全局反代;
        let sock;
        if (启用SOCKS5反代 == 'socks5' && 启用SOCKS5全局反代) {
            sock = await socks5Connect(host, port);
        } else if (启用SOCKS5反代 == 'http' && 启用SOCKS5全局反代) {
            sock = await httpConnect(host, port);
        } else {
            try {
                sock = connect({ hostname: host, port });
                await sock.opened;
            } catch {
                if (启用SOCKS5反代 == 'socks5') {
                    sock = await socks5Connect(host, port);
                } else if (启用SOCKS5反代 == 'http') {
                    sock = await httpConnect(host, port);
                } else {
                    const [反代IP地址, 反代IP端口] = await 解析地址端口(反代IP);
                    try {
                        sock = connect({ hostname: 反代IP地址, port: 反代IP端口 });
                    } catch {
                        sock = connect({ hostname: atob('UFJPWFlJUC50cDEuMDkwMjI3Lnh5eg=='), port: 1 });
                    }
                }
            }
        }
        return sock;
    }

    async function readLoop() {
        try {
            while (true) {
                const { done, value } = await reader.read();
                if (value?.length) {
                    bytesReceived += value.length;
                    lastData = Date.now();
                    stallCount = reconnectCount = 0;
                    if (ws.readyState === 1) {
                        await ws.send(value);
                        while (dataBuffer.length && ws.readyState === 1) {
                            await ws.send(dataBuffer.shift());
                        }
                    } else {
                        dataBuffer.push(value);
                    }
                }
                if (done) {
                    console.log('Stream ended gracefully');
                    await reconnect();
                    break;
                }
            }
        } catch (err) {
            console.error('Read error:', err.message);
            if (err.message.includes('reset') || err.message.includes('broken')) {
                console.log('Server closed connection, attempting reconnect');
                await reconnect();
            } else {
                cleanup();
                ws.close(1006, 'Connection abnormal');
            }
        }
    }

    async function reconnect() {
        if (!info || ws.readyState !== 1 || reconnectCount >= MAX_RECONNECT) {
            cleanup();
            ws.close(1011, 'Reconnection failed');
            return;
        }
        reconnectCount++;
        console.log(`Reconnecting (attempt ${reconnectCount})...`);
        try {
            cleanupSocket();
            await new Promise(resolve => setTimeout(resolve, 30 * Math.pow(2, reconnectCount) + Math.random() * 5));
            const sock = connect({ hostname: info.host, port: info.port });
            await sock.opened;
            socket = sock;
            writer = sock.writable.getWriter();
            reader = sock.readable.getReader();
            lastData = Date.now();
            stallCount = 0;
            console.log('Reconnected successfully');
            while (dataBuffer.length && ws.readyState === 1) {
                await writer.write(dataBuffer.shift());
            }
            readLoop();
        } catch (err) {
            console.error('Reconnect failed:', err.message);
            setTimeout(reconnect, 1000);
        }
    }

    function startTimers() {
        timers.keepalive = setInterval(async () => {
            if (Date.now() - lastData > KEEPALIVE) {
                try {
                    await writer.write(new Uint8Array(0));
                    lastData = Date.now();
                } catch (e) {
                    console.error('Keepalive failed:', e.message);
                    reconnect();
                }
            }
        }, KEEPALIVE / 3);
        timers.health = setInterval(() => {
            if (bytesReceived && Date.now() - lastData > STALL_TIMEOUT) {
                stallCount++;
                console.log(`Stall detected (${stallCount}/${MAX_STALL}), ${Date.now() - lastData}ms since last data`);
                if (stallCount >= MAX_STALL) reconnect();
            }
        }, STALL_TIMEOUT / 2);
    }

    function cleanupSocket() {
        try {
            writer?.releaseLock();
            reader?.releaseLock();
            socket?.close();
        } catch { }
    }

    function cleanup() {
        Object.values(timers).forEach(clearInterval);
        cleanupSocket();
    }

    // 处理 early data
    function processEarlyData(earlyDataHeader) {
        if (!earlyDataHeader) return null;
        try {
            const base64Str = earlyDataHeader.replace(/-/g, "+").replace(/_/g, "/");
            const decode = atob(base64Str);
            const arryBuffer = Uint8Array.from(decode, (c) => c.charCodeAt(0));
            return arryBuffer;
        } catch (error) {
            return null;
        }
    }

    ws.addEventListener('message', async evt => {
        try {
            if (isFirstMsg) {
                isFirstMsg = false;
                // 合并 early data 和第一条消息
                let firstData = evt.data;
                const earlyData = processEarlyData(earlyDataHeader);
                if (earlyData) {
                    const combined = new Uint8Array(earlyData.length + firstData.byteLength);
                    combined.set(earlyData);
                    combined.set(new Uint8Array(firstData), earlyData.length);
                    firstData = combined.buffer;
                }

                const bytes = new Uint8Array(firstData);
                if (bytes.byteLength >= 58 && bytes[56] === 0x0d && bytes[57] === 0x0a) ({ socket, writer, reader, info } = await 处理木马握手(firstData));
                else ({ socket, writer, reader, info } = await 处理魏烈思握手(firstData));
                startTimers();
                readLoop();
            } else {
                lastData = Date.now();
                if (socket && writer) {
                    await writer.write(evt.data);
                } else {
                    dataBuffer.push(evt.data);
                }
            }
        } catch (err) {
            console.error('Connection error:', err.message);
            cleanup();
            ws.close(1006, 'Connection abnormal');
        }
    });

    ws.addEventListener('close', cleanup);
    ws.addEventListener('error', cleanup);
}

function parseAddress(bytes, offset, addrType) {
    let host, length, endOffset;
    switch (addrType) {
        case 1: // IPv4
            length = 4;
            host = Array.from(bytes.slice(offset, offset + length)).join('.');
            endOffset = offset + length;
            break;
        case 2:
        case 3:
            length = bytes[offset];
            host = new TextDecoder().decode(bytes.slice(offset + 1, offset + 1 + length));
            endOffset = offset + 1 + length;
            break;
        case 4: // IPv6
            length = 16;
            const ipv6 = [];
            for (let i = 0; i < 8; i++) {
                ipv6.push(((bytes[offset + i * 2] << 8) | bytes[offset + i * 2 + 1]).toString(16));
            }
            host = ipv6.join(':');
            endOffset = offset + length;
            break;
        default:
            throw new Error(`Invalid address type: ${addrType}`);
    }
    return { host, length: endOffset };
}
////////////////////////////////SOCKS5/HTTP函数///////////////////////////////////////////////
async function httpConnect(addressRemote, portRemote) {
    const { username, password, hostname, port } = parsedSocks5Address;
    const sock = await connect({ hostname, port });
    const authHeader = username && password ? `Proxy-Authorization: Basic ${btoa(`${username}:${password}`)}\r\n` : '';
    const connectRequest = `CONNECT ${addressRemote}:${portRemote} HTTP/1.1\r\n` +
        `Host: ${addressRemote}:${portRemote}\r\n` +
        authHeader +
        `User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36\r\n` +
        `Proxy-Connection: Keep-Alive\r\n` +
        `Connection: Keep-Alive\r\n\r\n`;
    const writer = sock.writable.getWriter();
    try {
        await writer.write(new TextEncoder().encode(connectRequest));
    } catch (err) {
        throw new Error(`发送HTTP CONNECT请求失败: ${err.message}`);
    } finally {
        writer.releaseLock();
    }
    const reader = sock.readable.getReader();
    let responseBuffer = new Uint8Array(0);
    try {
        while (true) {
            const { value, done } = await reader.read();
            if (done) throw new Error('HTTP代理连接中断');
            const newBuffer = new Uint8Array(responseBuffer.length + value.length);
            newBuffer.set(responseBuffer);
            newBuffer.set(value, responseBuffer.length);
            responseBuffer = newBuffer;
            const respText = new TextDecoder().decode(responseBuffer);
            if (respText.includes('\r\n\r\n')) {
                const headersEndPos = respText.indexOf('\r\n\r\n') + 4;
                const headers = respText.substring(0, headersEndPos);

                if (!headers.startsWith('HTTP/1.1 200') && !headers.startsWith('HTTP/1.0 200')) {
                    throw new Error(`HTTP代理连接失败: ${headers.split('\r\n')[0]}`);
                }
                if (headersEndPos < responseBuffer.length) {
                    const remainingData = responseBuffer.slice(headersEndPos);
                    const { readable, writable } = new TransformStream();
                    new ReadableStream({
                        start(controller) {
                            controller.enqueue(remainingData);
                        }
                    }).pipeTo(writable).catch(() => { });
                    // @ts-ignore
                    sock.readable = readable;
                }
                break;
            }
        }
    } catch (err) {
        throw new Error(`处理HTTP代理响应失败: ${err.message}`);
    } finally {
        reader.releaseLock();
    }
    return sock;
}

async function socks5Connect(targetHost, targetPort) {
    const { username, password, hostname, port } = parsedSocks5Address;
    const sock = connect({
        hostname: hostname,
        port: port
    });
    await sock.opened;
    const w = sock.writable.getWriter();
    const r = sock.readable.getReader();
    await w.write(new Uint8Array([5, 2, 0, 2]));
    const auth = (await r.read()).value;
    if (auth[1] === 2 && username) {
        const user = new TextEncoder().encode(username);
        const pass = new TextEncoder().encode(password);
        await w.write(new Uint8Array([1, user.length, ...user, pass.length, ...pass]));
        await r.read();
    }
    const domain = new TextEncoder().encode(targetHost);
    await w.write(new Uint8Array([5, 1, 0, 3, domain.length, ...domain,
        targetPort >> 8, targetPort & 0xff
    ]));
    await r.read();
    w.releaseLock();
    r.releaseLock();
    return sock;
}

//////////////////////////////////////////////////功能性函数///////////////////////////////////////////////
function surge(content, url, config_JSON) {
    let 每行内容;
    if (content.includes('\r\n')) {
        每行内容 = content.split('\r\n');
    } else {
        每行内容 = content.split('\n');
    }

    let 输出内容 = "";
    for (let x of 每行内容) {
        if (x.includes('= tro' + 'jan,')) {
            console.log(x);
            const host = x.split("sni=")[1].split(",")[0];
            const 备改内容 = `sni=${host}, skip-cert-verify=${config_JSON.跳过证书验证}`;
            const 正确内容 = `sni=${host}, skip-cert-verify=${config_JSON.跳过证书验证}, ws=true, ws-path=${config_JSON.PATH}, ws-headers=Host:"${host}"`;
            输出内容 += x.replace(new RegExp(备改内容, 'g'), 正确内容).replace("[", "").replace("]", "") + '\n';
        } else {
            输出内容 += x + '\n';
        }
    }

    输出内容 = `#!MANAGED-CONFIG ${url} interval=${config_JSON.优选订阅生成.SUBUpdateTime * 60 * 60} strict=false` + 输出内容.substring(输出内容.indexOf('\n'));
    return 输出内容;
}
async function 请求日志记录(env, request, 访问IP, 请求类型 = "Get_SUB", config_JSON) {
    const KV容量限制 = 4;//MB
    try {
        const 当前时间 = new Date();
        const 日志内容 = { TYPE: 请求类型, IP: 访问IP, ASN: `AS${request.cf.asn || '0'} ${request.cf.asOrganization || 'Unknown'}`, CC: `${request.cf.country || 'N/A'} ${request.cf.city || 'N/A'}`, URL: request.url, UA: request.headers.get('User-Agent') || 'Unknown', TIME: 当前时间.getTime() };
        let 日志数组 = [];
        const 现有日志 = await env.KV.get('log.json');
        if (现有日志) {
            try {
                日志数组 = JSON.parse(现有日志);
                if (!Array.isArray(日志数组)) { 日志数组 = [日志内容]; }
                else if (请求类型 !== "Get_SUB") {
                    const 三十分钟前时间戳 = 当前时间.getTime() - 30 * 60 * 1000;
                    if (日志数组.some(log => log.TYPE !== "Get_SUB" && log.IP === 访问IP && log.URL === request.url && log.UA === (request.headers.get('User-Agent') || 'Unknown') && log.TIME >= 三十分钟前时间戳)) return;
                    日志数组.push(日志内容);
                    while (JSON.stringify(日志数组, null, 2).length > KV容量限制 * 1024 * 1024 && 日志数组.length > 0) 日志数组.shift();
                } else {
                    日志数组.push(日志内容);
                    while (JSON.stringify(日志数组, null, 2).length > KV容量限制 * 1024 * 1024 && 日志数组.length > 0) 日志数组.shift();
                }
                if (config_JSON.TG.启用) {
                    try {
                        const TG_TXT = await env.KV.get('tg.json');
                        const TG_JSON = JSON.parse(TG_TXT);
                        await sendMessage(TG_JSON.BotToken, TG_JSON.ChatID, 日志内容, config_JSON);
                    } catch (error) { console.error(`读取tg.json出错: ${error.message}`) }
                }
            } catch (e) { 日志数组 = [日志内容]; }
        } else { 日志数组 = [日志内容]; }
        await env.KV.put('log.json', JSON.stringify(日志数组, null, 2));
    } catch (error) { console.error(`日志记录失败: ${error.message}`); }
}

async function sendMessage(BotToken, ChatID, 日志内容, config_JSON) {
    if (!BotToken || !ChatID) return;

    try {
        const 请求时间 = new Date(日志内容.TIME).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
        const 请求URL = new URL(日志内容.URL);
        const msg = `<b>#${config_JSON.优选订阅生成.SUBNAME} 日志通知</b>\n\n` +
            `📌 <b>类型：</b>#${日志内容.TYPE}\n` +
            `🌐 <b>IP：</b><code>${日志内容.IP}</code>\n` +
            `📍 <b>位置：</b>${日志内容.CC}\n` +
            `🏢 <b>ASN：</b>${日志内容.ASN}\n` +
            `🔗 <b>域名：</b><code>${请求URL.host}</code>\n` +
            `🔍 <b>路径：</b><code>${请求URL.pathname + 请求URL.search}</code>\n` +
            `🤖 <b>UA：</b><code>${日志内容.UA}</code>\n` +
            `📅 <b>时间：</b>${请求时间}\n` +
            `${config_JSON.CF.Usage.success ? `📊 <b>请求用量：</b>${config_JSON.CF.Usage.total}/100000 <b>${((config_JSON.CF.Usage.total / 100000) * 100).toFixed(2)}%</b>\n` : ''}`;

        const url = `https://api.telegram.org/bot${BotToken}/sendMessage?chat_id=${ChatID}&parse_mode=HTML&text=${encodeURIComponent(msg)}`;
        return fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'text/html,application/xhtml+xml,application/xml;',
                'Accept-Encoding': 'gzip, deflate, br',
                'User-Agent': 日志内容.UA || 'Unknown',
            }
        });
    } catch (error) { console.error('Error sending message:', error) }
}

function 掩码敏感信息(文本, 前缀长度 = 3, 后缀长度 = 2) {
    if (!文本 || typeof 文本 !== 'string') return 文本;
    if (文本.length <= 前缀长度 + 后缀长度) return 文本; // 如果长度太短，直接返回

    const 前缀 = 文本.slice(0, 前缀长度);
    const 后缀 = 文本.slice(-后缀长度);
    const 星号数量 = 文本.length - 前缀长度 - 后缀长度;

    return `${前缀}${'*'.repeat(星号数量)}${后缀}`;
}

async function MD5MD5(文本) {
    const 编码器 = new TextEncoder();

    const 第一次哈希 = await crypto.subtle.digest('MD5', 编码器.encode(文本));
    const 第一次哈希数组 = Array.from(new Uint8Array(第一次哈希));
    const 第一次十六进制 = 第一次哈希数组.map(字节 => 字节.toString(16).padStart(2, '0')).join('');

    const 第二次哈希 = await crypto.subtle.digest('MD5', 编码器.encode(第一次十六进制.slice(7, 27)));
    const 第二次哈希数组 = Array.from(new Uint8Array(第二次哈希));
    const 第二次十六进制 = 第二次哈希数组.map(字节 => 字节.toString(16).padStart(2, '0')).join('');

    return 第二次十六进制.toLowerCase();
}

async function 读取config_JSON(env, host, userID, 重置配置 = false) {
    const 初始化开始时间 = performance.now();
    const 默认配置JSON = {
        TIME: new Date().toISOString(),
        HOST: host,
        UUID: userID,
        协议类型: "v" + "le" + "ss",
        传输协议: "ws",
        跳过证书验证: true,
        优选订阅生成: {
            local: true, // true: 基于本地的优选地址  false: 优选订阅生成器
            本地IP库: {
                随机IP: true, // 当 随机IP 为true时生效，启用随机IP的数量，否则使用KV内的ADD.txt
                随机数量: 16, // 当local为true时生效，随机IP的数量
            },
            SUB: null,
            SUBNAME: "edge" + "tunnel",
            SUBUpdateTime: 6, // 订阅更新时间（小时）
            TOKEN: await MD5MD5(host + userID),
        },
        订阅转换配置: {
            SUBAPI: "https://SUBAPI.cmliussss.net",
            SUBCONFIG: "https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/refs/heads/master/Clash/config/ACL4SSR_Online_Mini_MultiMode.ini",
            SUBEMOJI: false,
        },
        反代: {
            PROXYIP: "auto",
            SOCKS5: {
                启用: 启用SOCKS5反代,
                全局: 启用SOCKS5全局反代,
                账号: 我的SOCKS5账号,
                白名单: SOCKS5白名单,
            },
        },
        TG: {
            启用: false,
            BotToken: null,
            ChatID: null,
        },
        CF: {
            Email: null,
            GlobalAPIKey: null,
            AccountID: null,
            APIToken: null,
            Usage: {
                success: false,
                pages: 0,
                workers: 0,
                total: 0,
            },
        }
    };

    try {
        let configJSON = await env.KV.get('config.json');
        if (!configJSON || 重置配置 == true) {
            await env.KV.put('config.json', JSON.stringify(默认配置JSON, null, 2));
            config_JSON = 默认配置JSON;
        } else {
            config_JSON = JSON.parse(configJSON);
        }
    } catch (error) {
        console.error(`读取config_JSON出错: ${error.message}`);
        config_JSON = 默认配置JSON;
    }

    config_JSON.HOST = host;
    config_JSON.UUID = userID;
    config_JSON.PATH = config_JSON.反代.SOCKS5.启用 ? ('/' + config_JSON.反代.SOCKS5.启用 + (config_JSON.反代.SOCKS5.全局 ? '://' : '=') + config_JSON.反代.SOCKS5.账号) : (config_JSON.反代.PROXYIP === 'auto' ? '/' : `/proxyip=${config_JSON.反代.PROXYIP}`);
    config_JSON.LINK = `${config_JSON.协议类型}://${userID}@${host}:443?security=tls&type=${config_JSON.传输协议}&host=${host}&sni=${host}&path=${encodeURIComponent(config_JSON.PATH)}&fragment=${encodeURIComponent('1,40-60,30-50,tlshello')}&encryption=none${config_JSON.跳过证书验证 ? '&allowInsecure=1' : ''}#${encodeURIComponent(config_JSON.优选订阅生成.SUBNAME)}`;
    config_JSON.优选订阅生成.TOKEN = await MD5MD5(host + userID);

    const 初始化TG_JSON = { BotToken: null, ChatID: null };
    config_JSON.TG = { 启用: config_JSON.TG.启用 ? config_JSON.TG.启用 : false, ...初始化TG_JSON };
    try {
        const TG_TXT = await env.KV.get('tg.json');
        if (!TG_TXT) {
            await env.KV.put('tg.json', JSON.stringify(初始化TG_JSON, null, 2));
        } else {
            const TG_JSON = JSON.parse(TG_TXT);
            config_JSON.TG.ChatID = TG_JSON.ChatID ? TG_JSON.ChatID : null;
            config_JSON.TG.BotToken = TG_JSON.BotToken ? 掩码敏感信息(TG_JSON.BotToken) : null;
        }
    } catch (error) {
        console.error(`读取tg.json出错: ${error.message}`);
    }

    const 初始化CF_JSON = { Email: null, GlobalAPIKey: null, AccountID: null, APIToken: null };
    config_JSON.CF = { ...初始化CF_JSON, Usage: { success: false, pages: 0, workers: 0, total: 0 } };
    try {
        const CF_TXT = await env.KV.get('cf.json');
        if (!CF_TXT) {
            await env.KV.put('cf.json', JSON.stringify(初始化CF_JSON, null, 2));
        } else {
            const CF_JSON = JSON.parse(CF_TXT);
            config_JSON.CF.Email = CF_JSON.Email ? CF_JSON.Email : null;
            config_JSON.CF.GlobalAPIKey = CF_JSON.GlobalAPIKey ? 掩码敏感信息(CF_JSON.GlobalAPIKey) : null;
            config_JSON.CF.AccountID = CF_JSON.AccountID ? 掩码敏感信息(CF_JSON.AccountID) : null;
            config_JSON.CF.APIToken = CF_JSON.APIToken ? 掩码敏感信息(CF_JSON.APIToken) : null;
            const Usage = await getCloudflareUsage(CF_JSON.Email, CF_JSON.GlobalAPIKey, CF_JSON.AccountID, CF_JSON.APIToken);
            config_JSON.CF.Usage = Usage;
        }
    } catch (error) {
        console.error(`读取cf.json出错: ${error.message}`);
    }

    config_JSON.加载时间 = (performance.now() - 初始化开始时间).toFixed(2) + 'ms';
    return config_JSON;
}

async function 生成随机IP(request, count = 16) {
    const asnMap = { '9808': 'cmcc', '4837': 'cu', '4134': 'ct' }, asn = request.cf.asn;
    const cidr_url = asnMap[asn] ? `https://raw.githubusercontent.com/cmliu/cmliu/main/CF-CIDR/${asnMap[asn]}.txt` : 'https://raw.githubusercontent.com/cmliu/cmliu/main/CF-CIDR.txt';
    const cfname = { '9808': 'CF移动优选', '4837': 'CF联通优选', '4134': 'CF电信优选' }[asn] || 'CF官方优选';
    let cidrList = [];
    try { const res = await fetch(cidr_url); cidrList = res.ok ? await 整理成数组(await res.text()) : ['104.16.0.0/13']; } catch { cidrList = ['104.16.0.0/13']; }

    const generateRandomIPFromCIDR = (cidr) => {
        const [baseIP, prefixLength] = cidr.split('/'), prefix = parseInt(prefixLength), hostBits = 32 - prefix;
        const ipInt = baseIP.split('.').reduce((a, p, i) => a | (parseInt(p) << (24 - i * 8)), 0);
        const randomOffset = Math.floor(Math.random() * Math.pow(2, hostBits));
        const mask = (0xFFFFFFFF << hostBits) >>> 0, randomIP = (((ipInt & mask) >>> 0) + randomOffset) >>> 0;
        return [(randomIP >>> 24) & 0xFF, (randomIP >>> 16) & 0xFF, (randomIP >>> 8) & 0xFF, randomIP & 0xFF].join('.');
    };

    const randomIPs = Array.from({ length: count }, () => {
        const ip = generateRandomIPFromCIDR(cidrList[Math.floor(Math.random() * cidrList.length)]);
        return `${ip}#${cfname}`;
    });
    return [randomIPs, randomIPs.join('\n')];
}
async function 整理成数组(内容) {
    var 替换后的内容 = 内容.replace(/[	"'\r\n]+/g, ',').replace(/,+/g, ',');
    if (替换后的内容.charAt(0) == ',') 替换后的内容 = 替换后的内容.slice(1);
    if (替换后的内容.charAt(替换后的内容.length - 1) == ',') 替换后的内容 = 替换后的内容.slice(0, 替换后的内容.length - 1);
    const 地址数组 = 替换后的内容.split(',');
    return 地址数组;
}

async function 请求优选API(urls, 默认端口 = '443', 超时时间 = 3000) {
    if (!urls?.length) return [];
    const results = new Set();
    await Promise.allSettled(urls.map(async (url) => {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 超时时间);
            const response = await fetch(url, { signal: controller.signal });
            clearTimeout(timeoutId);
            // 处理编码问题：支持 UTF-8 和 GB2312 编码
            let text = '';
            try {
                const buffer = await response.arrayBuffer();
                const charset = (response.headers.get('content-type') || '').match(/charset=([^\s;]+)/i)?.[1]?.toLowerCase() || '';
                const decoders = charset.match(/gb/) ? ['gb2312', 'utf-8'] : ['utf-8', 'gb2312'];
                for (const dec of decoders) {
                    try {
                        text = new TextDecoder(dec).decode(buffer);
                        if (dec === 'utf-8' && (text.includes('�') || (text.length > 0 && /[\x80-\xFF]/.test(text) && !text.includes('中')))) continue;
                        break;
                    } catch { }
                }
            } catch { text = await response.text() }
            const lines = text.trim().split('\n').map(l => l.trim()).filter(l => l);
            const isCSV = lines.length > 1 && lines[0].includes(',');
            const IPV6_PATTERN = /^[^\[\]]*:[^\[\]]*:[^\[\]]/;
            if (!isCSV) {
                lines.forEach(line => {
                    const hashIndex = line.indexOf('#');
                    const [hostPart, remark] = hashIndex > -1 ? [line.substring(0, hashIndex), line.substring(hashIndex)] : [line, ''];
                    let hasPort = false;
                    if (hostPart.startsWith('[')) {
                        hasPort = /\]:(\d+)$/.test(hostPart);
                    } else {
                        const colonIndex = hostPart.lastIndexOf(':');
                        hasPort = colonIndex > -1 && /^\d+$/.test(hostPart.substring(colonIndex + 1));
                    }
                    const port = new URL(url).searchParams.get('port') || 默认端口;
                    results.add(hasPort ? line : `${hostPart}:${port}${remark}`);
                });
            } else {
                const headers = lines[0].split(',').map(h => h.trim());
                const dataLines = lines.slice(1);
                if (headers.includes('IP地址') && headers.includes('端口') && headers.includes('数据中心')) {
                    const ipIdx = headers.indexOf('IP地址'), portIdx = headers.indexOf('端口');
                    const remarkIdx = headers.indexOf('国家') > -1 ? headers.indexOf('国家') :
                        headers.indexOf('城市') > -1 ? headers.indexOf('城市') : headers.indexOf('数据中心');
                    dataLines.forEach(line => {
                        const cols = line.split(',').map(c => c.trim());
                        const wrappedIP = IPV6_PATTERN.test(cols[ipIdx]) ? `[${cols[ipIdx]}]` : cols[ipIdx];
                        results.add(`${wrappedIP}:${cols[portIdx]}#${cols[remarkIdx]}`);
                    });
                } else if (headers.some(h => h.includes('IP')) && headers.some(h => h.includes('延迟')) && headers.some(h => h.includes('下载速度'))) {
                    const ipIdx = headers.findIndex(h => h.includes('IP'));
                    const delayIdx = headers.findIndex(h => h.includes('延迟'));
                    const speedIdx = headers.findIndex(h => h.includes('下载速度'));
                    const port = new URL(url).searchParams.get('port') || 默认端口;
                    dataLines.forEach(line => {
                        const cols = line.split(',').map(c => c.trim());
                        const wrappedIP = IPV6_PATTERN.test(cols[ipIdx]) ? `[${cols[ipIdx]}]` : cols[ipIdx];
                        results.add(`${wrappedIP}:${port}#CF优选 ${cols[delayIdx]}ms ${cols[speedIdx]}MB/s`);
                    });
                }
            }
        } catch (e) { }
    }));
    return Array.from(results);
}

async function 反代参数获取(request) {
    const url = new URL(request.url);
    const { pathname, searchParams } = url;
    const pathLower = pathname.toLowerCase();

    // 初始化
    我的SOCKS5账号 = searchParams.get('socks5') || searchParams.get('http') || 我的SOCKS5账号;
    启用SOCKS5全局反代 = searchParams.has('globalproxy') || 启用SOCKS5全局反代;

    // 统一处理反代IP参数 (优先级最高,使用正则一次匹配)
    const proxyMatch = pathLower.match(/\/(proxyip[.=]|pyip=|ip=)(.+)/);
    if (searchParams.has('proxyip')) {
        反代IP = searchParams.get('proxyip');
    } else if (proxyMatch) {
        反代IP = proxyMatch[1] === 'proxyip.' ? `proxyip.${proxyMatch[2]}` : proxyMatch[2];
    }

    // 新增：检查是否启用NAT64转换（基于proxyip参数）
    if (反代IP && 反代IP.toLowerCase().startsWith('nat64')) {
        const parts = 反代IP.split(':');
        if (parts.length > 1) {
            nat64Prefix = parts.slice(1).join(':');
            if (!nat64Prefix.endsWith('::')) nat64Prefix += '::';
        } else {
            nat64Prefix = '64:ff9b::'; // 默认Well-Known NAT64前缀
        }
        反代IP = 'auto'; // 重置反代IP为auto，因为nat64不是实际的反代IP
    }

    // 处理SOCKS5/HTTP代理参数
    let socksMatch;
    if ((socksMatch = pathname.match(/\/(socks5?|http):\/?\/?(.+)/i))) {
        // 格式: /socks5://... 或 /http://...
        启用SOCKS5反代 = socksMatch[1].toLowerCase() === 'http' ? 'http' : 'socks5';
        我的SOCKS5账号 = socksMatch[2].split('#')[0];
        启用SOCKS5全局反代 = true;

        // 处理Base64编码的用户名密码
        if (我的SOCKS5账号.includes('@')) {
            const atIndex = 我的SOCKS5账号.lastIndexOf('@');
            let userPassword = 我的SOCKS5账号.substring(0, atIndex).replaceAll('%3D', '=');
            if (/^(?:[A-Z0-9+/]{4})*(?:[A-Z0-9+/]{2}==|[A-Z0-9+/]{3}=)?$/i.test(userPassword) && !userPassword.includes(':')) {
                userPassword = atob(userPassword);
            }
            我的SOCKS5账号 = `${userPassword}@${我的SOCKS5账号.substring(atIndex + 1)}`;
        }
    } else if ((socksMatch = pathname.match(/\/(g?s5|socks5|g?http)=(.+)/i))) {
        // 格式: /socks5=... 或 /s5=... 或 /gs5=... 或 /http=... 或 /ghttp=...
        const type = socksMatch[1].toLowerCase();
        我的SOCKS5账号 = socksMatch[2];
        启用SOCKS5反代 = type.includes('http') ? 'http' : 'socks5';
        启用SOCKS5全局反代 = type.startsWith('g') || 启用SOCKS5全局反代; // gs5 或 ghttp 开头启用全局
    }

    // 解析SOCKS5地址
    if (我的SOCKS5账号) {
        try {
            parsedSocks5Address = await 获取SOCKS5账号(我的SOCKS5账号);
            启用SOCKS5反代 = searchParams.get('http') ? 'http' : 启用SOCKS5反代;
        } catch (err) {
            console.error('解析SOCKS5地址失败:', err.message);
            启用SOCKS5反代 = null;
        }
    }
}

async function 获取SOCKS5账号(address) {
    if (address.includes('@')) {
        const lastAtIndex = address.lastIndexOf('@');
        let userPassword = address.substring(0, lastAtIndex).replaceAll('%3D', '=');
        const base64Regex = /^(?:[A-Z0-9+/]{4})*(?:[A-Z0-9+/]{2}==|[A-Z0-9+/]{3}=)?$/i;
        if (base64Regex.test(userPassword) && !userPassword.includes(':')) userPassword = atob(userPassword);
        address = `${userPassword}@${address.substring(lastAtIndex + 1)}`;
    }
    const atIndex = address.lastIndexOf("@");
    const [hostPart, authPart] = atIndex === -1 ? [address, undefined] : [address.substring(atIndex + 1), address.substring(0, atIndex)];

    // 解析认证
    let username, password;
    if (authPart) {
        [username, password] = authPart.split(":");
        if (!password) throw new Error('无效的 SOCKS 地址格式：认证部分必须是 "username:password" 的形式');
    }

    // 解析主机端口
    let hostname, port;
    if (hostPart.includes("]:")) { // IPv6带端口
        [hostname, port] = [hostPart.split("]:")[0] + "]", Number(hostPart.split("]:")[1].replace(/[^\d]/g, ''))];
    } else if (hostPart.startsWith("[")) { // IPv6无端口
        [hostname, port] = [hostPart, 80];
    } else { // IPv4/域名
        const parts = hostPart.split(":");
        [hostname, port] = parts.length === 2 ? [parts[0], Number(parts[1].replace(/[^\d]/g, ''))] : [hostPart, 80];
    }

    if (isNaN(port)) throw new Error('无效的 SOCKS 地址格式：端口号必须是数字');
    if (hostname.includes(":") && !/^\[.*\]$/.test(hostname)) throw new Error('无效的 SOCKS 地址格式：IPv6 地址必须用方括号括起来，如 [2001:db8::1]');

    return { username, password, hostname, port };
}

async function getCloudflareUsage(Email, GlobalAPIKey, AccountID, APIToken) {
    const API = "https://api.cloudflare.com/client/v4";
    const sum = (a) => a?.reduce((t, i) => t + (i?.sum?.requests || 0), 0) || 0;
    const cfg = { "Content-Type": "application/json" };

    try {
        if (!AccountID && (!Email || !GlobalAPIKey)) throw new Error("请提供账户ID或API密钥");

        if (!AccountID) {
            const r = await fetch(`${API}/accounts`, {
                method: "GET",
                headers: { ...cfg, "X-AUTH-EMAIL": Email, "X-AUTH-KEY": GlobalAPIKey }
            });
            if (!r.ok) throw new Error(`账户获取失败: ${r.status}`);
            const d = await r.json();
            if (!d?.result?.length) throw new Error("未找到账户");
            const idx = d.result.findIndex(a => a.name?.toLowerCase().startsWith(Email.toLowerCase()));
            AccountID = d.result[idx >= 0 ? idx : 0]?.id;
        }

        const now = new Date();
        now.setUTCHours(0, 0, 0, 0);
        const hdr = APIToken ? { ...cfg, "Authorization": `Bearer ${APIToken}` } : { ...cfg, "X-AUTH-EMAIL": Email, "X-AUTH-KEY": GlobalAPIKey };

        const res = await fetch(`${API}/graphql`, {
            method: "POST",
            headers: hdr,
            body: JSON.stringify({
                query: `query getBillingMetrics($AccountID: String!, $filter: AccountWorkersInvocationsAdaptiveFilter_InputObject) {
                    viewer { accounts(filter: {accountTag: $AccountID}) {
                        pagesFunctionsInvocationsAdaptiveGroups(limit: 1000, filter: $filter) { sum { requests } }
                        workersInvocationsAdaptive(limit: 10000, filter: $filter) { sum { requests } }
                    } }
                }`,
                variables: { AccountID, filter: { datetime_geq: now.toISOString(), datetime_leq: new Date().toISOString() } }
            })
        });

        if (!res.ok) throw new Error(`查询失败: ${res.status}`);
        const result = await res.json();
        if (result.errors?.length) throw new Error(result.errors[0].message);

        const acc = result?.data?.viewer?.accounts?.[0];
        if (!acc) throw new Error("未找到账户数据");

        const pages = sum(acc.pagesFunctionsInvocationsAdaptiveGroups);
        const workers = sum(acc.workersInvocationsAdaptive);
        const total = pages + workers;
        console.log(`统计结果 - Pages: ${pages}, Workers: ${workers}, 总计: ${total}`);
        return { success: true, pages, workers, total };

    } catch (error) {
        console.error('获取使用量错误:', error.message);
        return { success: false, pages: 0, workers: 0, total: 0 };
    }
}

function sha224(s) {
    const K = [0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2];
    const r = (n, b) => ((n >>> b) | (n << (32 - b))) >>> 0;
    s = unescape(encodeURIComponent(s));
    const l = s.length * 8; s += String.fromCharCode(0x80);
    while ((s.length * 8) % 512 !== 448) s += String.fromCharCode(0);
    const h = [0xc1059ed8, 0x367cd507, 0x3070dd17, 0xf70e5939, 0xffc00b31, 0x68581511, 0x64f98fa7, 0xbefa4fa4];
    const hi = Math.floor(l / 0x100000000), lo = l & 0xFFFFFFFF;
    s += String.fromCharCode((hi >>> 24) & 0xFF, (hi >>> 16) & 0xFF, (hi >>> 8) & 0xFF, hi & 0xFF, (lo >>> 24) & 0xFF, (lo >>> 16) & 0xFF, (lo >>> 8) & 0xFF, lo & 0xFF);
    const w = []; for (let i = 0; i < s.length; i += 4)w.push((s.charCodeAt(i) << 24) | (s.charCodeAt(i + 1) << 16) | (s.charCodeAt(i + 2) << 8) | s.charCodeAt(i + 3));
    for (let i = 0; i < w.length; i += 16) {
        const x = new Array(64).fill(0);
        for (let j = 0; j < 16; j++)x[j] = w[i + j];
        for (let j = 16; j < 64; j++) {
            const s0 = r(x[j - 15], 7) ^ r(x[j - 15], 18) ^ (x[j - 15] >>> 3);
            const s1 = r(x[j - 2], 17) ^ r(x[j - 2], 19) ^ (x[j - 2] >>> 10);
            x[j] = (x[j - 16] + s0 + x[j - 7] + s1) >>> 0;
        }
        let [a, b, c, d, e, f, g, h0] = h;
        for (let j = 0; j < 64; j++) {
            const S1 = r(e, 6) ^ r(e, 11) ^ r(e, 25), ch = (e & f) ^ (~e & g), t1 = (h0 + S1 + ch + K[j] + x[j]) >>> 0;
            const S0 = r(a, 2) ^ r(a, 13) ^ r(a, 22), maj = (a & b) ^ (a & c) ^ (b & c), t2 = (S0 + maj) >>> 0;
            h0 = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = b; b = a; a = (t1 + t2) >>> 0;
        }
        for (let j = 0; j < 8; j++)h[j] = (h[j] + (j === 0 ? a : j === 1 ? b : j === 2 ? c : j === 3 ? d : j === 4 ? e : j === 5 ? f : j === 6 ? g : h0)) >>> 0;
    }
    let hex = '';
    for (let i = 0; i < 7; i++) {
        for (let j = 24; j >= 0; j -= 8)hex += ((h[i] >>> j) & 0xFF).toString(16).padStart(2, '0');
    }
    return hex;
}

async function 解析地址端口(proxyIP) {
    proxyIP = proxyIP.toLowerCase();
    if (proxyIP.includes('.william')) {
        const williamResult = await (async function 解析William域名(william) {
            try {
                const response = await fetch(`https://1.1.1.1/dns-query?name=${william}&type=TXT`, { headers: { 'Accept': 'application/dns-json' } });
                if (!response.ok) return null;
                const data = await response.json();
                const txtRecords = (data.Answer || []).filter(record => record.type === 16).map(record => record.data);
                if (txtRecords.length === 0) return null;
                let txtData = txtRecords[0];
                if (txtData.startsWith('"') && txtData.endsWith('"')) txtData = txtData.slice(1, -1);
                const prefixes = txtData.replace(/\\010/g, ',').replace(/\n/g, ',').split(',').map(s => s.trim()).filter(Boolean);
                if (prefixes.length === 0) return null;
                return prefixes[Math.floor(Math.random() * prefixes.length)];
            } catch (error) {
                console.error('解析ProxyIP失败:', error);
                return null;
            }
        })(proxyIP);
        proxyIP = williamResult || proxyIP;
    }
    let 地址 = proxyIP, 端口 = 443;
    if (proxyIP.includes('.tp')) {
        const tpMatch = proxyIP.match(/\.tp(\d+)/);
        if (tpMatch) 端口 = parseInt(tpMatch[1], 10);
        return [地址, 端口];
    }
    if (proxyIP.includes(']:')) {
        const parts = proxyIP.split(']:');
        地址 = parts[0] + ']';
        端口 = parseInt(parts[1], 10) || 端口;
    } else if (proxyIP.includes(':') && !proxyIP.startsWith('[')) {
        const colonIndex = proxyIP.lastIndexOf(':');
        地址 = proxyIP.slice(0, colonIndex);
        端口 = parseInt(proxyIP.slice(colonIndex + 1), 10) || 端口;
    }
    return [地址, 端口];
}

async function SOCKS5可用性验证(代理协议 = 'socks5', 代理参数) {
    try { parsedSocks5Address = await 获取SOCKS5账号(代理参数); } catch (err) { return { success: false, error: err.message, proxy: 代理协议 + "://" + 代理参数 }; }
    const { username, password, hostname, port } = parsedSocks5Address;
    const 完整代理参数 = username && password ? `${username}:${password}@${hostname}:${port}` : `${hostname}:${port}`;
    try {
        const tcpSocket = 代理协议 == 'socks5' ? await socks5Connect('check.socks5.090227.xyz', 80) : await httpConnect('check.socks5.090227.xyz', 80);
        if (!tcpSocket) return { success: false, error: '无法连接到代理服务器', proxy: 代理协议 + "://" + 完整代理参数 };
        try {
            const writer = tcpSocket.writable.getWriter(), encoder = new TextEncoder();
            await writer.write(encoder.encode(`GET /cdn-cgi/trace HTTP/1.1\r\nHost: check.socks5.090227.xyz\r\nConnection: close\r\n\r\n`));
            writer.releaseLock();
            const reader = tcpSocket.readable.getReader(), decoder = new TextDecoder();
            let response = '';
            try { while (true) { const { done, value } = await reader.read(); if (done) break; response += decoder.decode(value, { stream: true }); } } finally { reader.releaseLock(); }
            await tcpSocket.close();
            return { success: true, proxy: 代理协议 + "://" + 完整代理参数, ip: response.match(/ip=(.*)/)[1], loc: response.match(/loc=(.*)/)[1] };
        } catch (error) {
            try { await tcpSocket.close(); } catch (e) { console.log('关闭连接时出错:', e); }
            return { success: false, error: error.message, proxy: 代理协议 + "://" + 完整代理参数 };
        }
    } catch (error) { return { success: false, error: error.message, proxy: 代理协议 + "://" + 完整代理参数 }; }
}
// 新增：IPv4到NAT64 IPv6地址转换函数
function ipv4ToNat64(ipv4, prefix) {
    const [a, b, c, d] = ipv4.split('.').map(Number);
    const hex1 = ((a << 8) | b).toString(16).padStart(4, '0');
    const hex2 = ((c << 8) | d).toString(16).padStart(4, '0');
    return `${prefix}${hex1}:${hex2}`;
}
//////////////////////////////////////////////////////HTML伪装页面///////////////////////////////////////////////
async function nginx() {
    return `
	<!DOCTYPE html>
	<html>
	<head>
	<title>Welcome to nginx!</title>
	<style>
		body {
			width: 35em;
			margin: 0 auto;
			font-family: Tahoma, Verdana, Arial, sans-serif;
		}
	</style>
	</head>
	<body>
	<h1>Welcome to nginx!</h1>
	<p>If you see this page, the nginx web server is successfully installed and
	working. Further configuration is required.</p>
	
	<p>For online documentation and support please refer to
	<a href="http://nginx.org/">nginx.org</a>.<br/>
	Commercial support is available at
	<a href="http://nginx.com/">nginx.com</a>.</p>
	
	<p><em>Thank you for using nginx.</em></p>
	</body>
	</html>
	`
}

async function html1101(host, 访问IP) {
    const now = new Date();
    const 格式化时间戳 = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0') + ' ' + String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0') + ':' + String(now.getSeconds()).padStart(2, '0');
    const 随机字符串 = Array.from(crypto.getRandomValues(new Uint8Array(8))).map(b => b.toString(16).padStart(2, '0')).join('');

    return `<!DOCTYPE html>
<!--[if lt IE 7]> <html class="no-js ie6 oldie" lang="en-US"> <![endif]-->
<!--[if IE 7]>    <html class="no-js ie7 oldie" lang="en-US"> <![endif]-->
<!--[if IE 8]>    <html class="no-js ie8 oldie" lang="en-US"> <![endif]-->
<!--[if gt IE 8]><!--> <html class="no-js" lang="en-US"> <!--<![endif]-->
<head>
<title>Worker threw exception | ${host} | Cloudflare</title>
<meta charset="UTF-8" />
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<meta http-equiv="X-UA-Compatible" content="IE=Edge" />
<meta name="robots" content="noindex, nofollow" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<link rel="stylesheet" id="cf_styles-css" href="/cdn-cgi/styles/cf.errors.css" />
<!--[if lt IE 9]><link rel="stylesheet" id='cf_styles-ie-css' href="/cdn-cgi/styles/cf.errors.ie.css" /><![endif]-->
<style>body{margin:0;padding:0}</style>


<!--[if gte IE 10]><!-->
<script>
  if (!navigator.cookieEnabled) {
    window.addEventListener('DOMContentLoaded', function () {
      var cookieEl = document.getElementById('cookie-alert');
      cookieEl.style.display = 'block';
    })
  }
</script>
<!--<![endif]-->

</head>
<body>
    <div id="cf-wrapper">
        <div class="cf-alert cf-alert-error cf-cookie-error" id="cookie-alert" data-translate="enable_cookies">Please enable cookies.</div>
        <div id="cf-error-details" class="cf-error-details-wrapper">
            <div class="cf-wrapper cf-header cf-error-overview">
                <h1>
                    <span class="cf-error-type" data-translate="error">Error</span>
                    <span class="cf-error-code">1101</span>
                    <small class="heading-ray-id">Ray ID: ${随机字符串} &bull; ${格式化时间戳} UTC</small>
                </h1>
                <h2 class="cf-subheadline" data-translate="error_desc">Worker threw exception</h2>
            </div><!-- /.header -->
    
            <section></section><!-- spacer -->
    
            <div class="cf-section cf-wrapper">
                <div class="cf-columns two">
                    <div class="cf-column">
                        <h2 data-translate="what_happened">What happened?</h2>
                            <p>You've requested a page on a website (${host}) that is on the <a href="https://www.cloudflare.com/5xx-error-landing?utm_source=error_100x" target="_blank">Cloudflare</a> network. An unknown error occurred while rendering the page.</p>
                    </div>
                    
                    <div class="cf-column">
                        <h2 data-translate="what_can_i_do">What can I do?</h2>
                            <p><strong>If you are the owner of this website:</strong><br />refer to <a href="https://developers.cloudflare.com/workers/observability/errors/" target="_blank">Workers - Errors and Exceptions</a> and check Workers Logs for ${host}.</p>
                    </div>
                    
                </div>
            </div><!-- /.section -->
    
            <div class="cf-error-footer cf-wrapper w-240 lg:w-full py-10 sm:py-4 sm:px-8 mx-auto text-center sm:text-left border-solid border-0 border-t border-gray-300">
    <p class="text-13">
      <span class="cf-footer-item sm:block sm:mb-1">Cloudflare Ray ID: <strong class="font-semibold"> ${随机字符串}</strong></span>
      <span class="cf-footer-separator sm:hidden">&bull;</span>
      <span id="cf-footer-item-ip" class="cf-footer-item hidden sm:block sm:mb-1">
        Your IP:
        <button type="button" id="cf-footer-ip-reveal" class="cf-footer-ip-reveal-btn">Click to reveal</button>
        <span class="hidden" id="cf-footer-ip">${访问IP}</span>
        <span class="cf-footer-separator sm:hidden">&bull;</span>
      </span>
      <span class="cf-footer-item sm:block sm:mb-1"><span>Performance &amp; security by</span> <a rel="noopener noreferrer" href="https://www.cloudflare.com/5xx-error-landing" id="brand_link" target="_blank">Cloudflare</a></span>
      
    </p>
    <script>(function(){function d(){var b=a.getElementById("cf-footer-item-ip"),c=a.getElementById("cf-footer-ip-reveal");b&&"classList"in b&&(b.classList.remove("hidden"),c.addEventListener("click",function(){c.classList.add("hidden");a.getElementById("cf-footer-ip").classList.remove("hidden")}))}var a=document;document.addEventListener&&a.addEventListener("DOMContentLoaded",d)})();</script>
  </div><!-- /.error-footer -->

        </div><!-- /#cf-error-details -->
    </div><!-- /#cf-wrapper -->

     <script>
    window._cf_translation = {};
    
    
  </script> 
</body>
</html>`;
}