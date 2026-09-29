import json

with open('scanned_projects_detailed.json', encoding='utf-8') as f:
    data = json.load(f)

with open('formatted_project_inventory.txt', 'w', encoding='utf-8') as out:
    out.write(f"TOTAL F:\\antigravity: {len(data['f_antigravity'])}\n")
    out.write(f"TOTAL C:\\xampp\\htdocs: {len(data['c_xampp_htdocs'])}\n\n")
    
    out.write("=== F:\\antigravity ===\n")
    for i, p in enumerate(data['f_antigravity'], 1):
        out.write(f"{i}. Name: {p['name']}\n   Path: {p['path']}\n   Server: {p['server']}\n   GitHub: {p['github']}\n\n")

    out.write("\n=== C:\\xampp\\htdocs ===\n")
    for i, p in enumerate(data['c_xampp_htdocs'], 1):
        out.write(f"{i}. Name: {p['name']}\n   Path: {p['path']}\n   Server: {p['server']}\n   GitHub: {p['github']}\n\n")

print("Inventory generated successfully in formatted_project_inventory.txt")
