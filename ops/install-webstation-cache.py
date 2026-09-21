#!/usr/bin/env python3
"""Install the TimeForge-only Web Station include, validate, then reload nginx."""
import pathlib,subprocess
root=pathlib.Path(__file__).resolve().parents[1]
target=pathlib.Path('/usr/local/etc/nginx/conf.d/.webstation.error_page.default.resource.conf.timeforge')
previous=target.read_bytes() if target.exists() else None
try:
 target.write_bytes((root/'ops/nginx/timeforge.conf').read_bytes())
 subprocess.run(['/bin/nginx','-t'],check=True)
 subprocess.run(['/bin/nginx','-s','reload'],check=True)
except Exception:
 if previous is None:target.unlink(missing_ok=True)
 else:target.write_bytes(previous)
 raise
print('Installed TimeForge-only cache revalidation and SPA fallback; nginx validated and reloaded.')
