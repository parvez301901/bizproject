import json
import os
import subprocess

def get_git_remote(path):
    git_dir = os.path.join(path, '.git')
    if os.path.exists(git_dir):
        try:
            res = subprocess.run(['git', '-C', path, 'config', '--get', 'remote.origin.url'], capture_output=True, text=True, timeout=5)
            return res.stdout.strip()
        except:
            return ''
    return ''

def check_server_type(path):
    # Check framework or server type
    files = set(os.listdir(path)) if os.path.exists(path) else set()
    server_info = []
    if 'artisan' in files:
        server_info.append('Laravel / PHP (Apache or php artisan serve)')
    elif any(f.endswith('.php') for f in files) or 'index.php' in files:
        server_info.append('PHP / Apache (XAMPP http://localhost/...)')
    
    if 'package.json' in files:
        try:
            with open(os.path.join(path, 'package.json'), 'r', encoding='utf-8', errors='ignore') as f:
                pkg = json.load(f)
                deps = {**pkg.get('dependencies', {}), **pkg.get('devDependencies', {})}
                if 'next' in deps:
                    server_info.append('Next.js (Node: npm run dev / port 3000)')
                elif 'vite' in deps:
                    server_info.append('Vite / React (Node: npm run dev)')
                elif 'express' in deps:
                    server_info.append('Express.js (Node server)')
                else:
                    server_info.append('Node.js app')
        except:
            server_info.append('Node.js app')
    
    if 'pubspec.yaml' in files:
        server_info.append('Flutter App')
    if 'docker-compose.yml' in files or 'Dockerfile' in files:
        server_info.append('Docker')
    if 'requirements.txt' in files or any(f.endswith('.py') for f in files):
        server_info.append('Python')

    return ', '.join(server_info) if server_info else 'Static / Script / Document'

def scan_dir(base_dir):
    results = []
    if not os.path.exists(base_dir):
        return results
    for item in sorted(os.listdir(base_dir)):
        full = os.path.join(base_dir, item)
        if os.path.isdir(full) and not item.startswith('.'):
            remote = get_git_remote(full)
            server = check_server_type(full)
            results.append({
                'name': item,
                'path': full.replace('\\', '/'),
                'github': remote if remote else 'Local only (No remote)',
                'server': server
            })
    return results

f_list = scan_dir(r'F:\antigravity')
c_list = scan_dir(r'C:\xampp\htdocs')

with open('scanned_projects_detailed.json', 'w', encoding='utf-8') as out:
    json.dump({'f_antigravity': f_list, 'c_xampp_htdocs': c_list}, out, indent=2)

print(f"Scanned {len(f_list)} projects in F:\\antigravity and {len(c_list)} in C:\\xampp\\htdocs")
