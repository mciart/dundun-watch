import { checkSite } from './http.js';
import { checkTcpSite } from './tcp.js';
import { checkDnsSite } from './dns.js';
import { checkPushSite } from './push.js';

export function getMonitorForSite(site) {
  if (site.monitorType === 'dns') return checkDnsSite;
  if (site.monitorType === 'tcp') return checkTcpSite;
  if (site.monitorType === 'push') return (site, now) => checkPushSite(site, now, site.pushTimeoutMinutes || 3);
  return checkSite;
}

export { checkSite, checkTcpSite, checkDnsSite, checkPushSite };
