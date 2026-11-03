"""Install the dedicated teaser services on the user's Mac mini."""
from pathlib import Path
import plistlib
import sys

base = Path('/Users/liwenyu/Sites/pmsg-beyond')
tunnel_id = sys.argv[1]
agents = Path('/Users/liwenyu/Library/LaunchAgents')
logs = Path('/Users/liwenyu/Library/Logs')
logs.mkdir(exist_ok=True)

services = {
    'com.wenyuli.pmsg-beyond': {
        'ProgramArguments': ['/opt/homebrew/bin/node', str(base/'current/server.mjs')],
        'WorkingDirectory': str(base/'current'),
        'EnvironmentVariables': {
            'PATH': '/opt/homebrew/bin:/usr/bin:/bin',
            'PMSG_ORIGIN': 'https://beyond.wenyuli.site',
            'PMSG_PORT': '18770',
            'PMSG_SITE_ROOT': str(base/'current/site'),
            'PMSG_SECRET_FILE': str(base/'shared/access.json'),
        },
    },
    'com.wenyuli.pmsg-beyond-tunnel': {
        'ProgramArguments': ['/opt/homebrew/bin/cloudflared', '--config', str(base/'shared/tunnel.yml'), 'tunnel', 'run', tunnel_id],
        'EnvironmentVariables': {'PATH': '/opt/homebrew/bin:/usr/bin:/bin'},
    },
}
for label, options in services.items():
    record = dict(options, Label=label, RunAtLoad=True, KeepAlive=True, ThrottleInterval=10,
                  StandardOutPath=str(logs/(label+'.log')),
                  StandardErrorPath=str(logs/(label+'.error.log')))
    target = agents/(label+'.plist')
    if target.exists():
        raise SystemExit('Existing service requires an explicit update: '+str(target))
    target.write_bytes(plistlib.dumps(record))
    target.chmod(0o600)
    print('Prepared',label)

config = base/'shared/tunnel.yml'
if config.exists():
    raise SystemExit('Existing tunnel configuration was not overwritten.')
config.write_text(f'''tunnel: {tunnel_id}
credentials-file: /Users/liwenyu/.cloudflared/{tunnel_id}.json
ingress:
  - hostname: beyond.wenyuli.site
    service: http://127.0.0.1:18770
  - service: http_status:404
''')
config.chmod(0o600)
