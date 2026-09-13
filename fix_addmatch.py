import os

file_path = 'src/View/Screen/Matches/AddMatchDialog.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. State and fields
content = content.replace("coach_id: '',", "coach_id: '', team_id: '',")
content = content.replace("coach_id: '', admin_id: ''", "coach_id: '', admin_id: '', team_id: ''")
content = content.replace(
    "admin_id: matchData.admin_id?.id ? matchData.admin_id.id.toString() : (matchData.admin_id ? matchData.admin_id.toString() : '')", 
    "admin_id: matchData.admin_id?.id ? matchData.admin_id.id.toString() : (matchData.admin_id ? matchData.admin_id.toString() : ''),\n          team_id: matchData.team_id?.id ? matchData.team_id.id.toString() : (matchData.team_id ? matchData.team_id.toString() : (matchData.team?.id ? matchData.team.id.toString() : ''))"
)

content = content.replace("const [individuals, setIndividuals] = useState<any[]>([]);", "const [individuals, setIndividuals] = useState<any[]>([]);\n  const [teams, setTeams] = useState<any[]>([]);")

# 2. Fetching
content = content.replace("const [indRes, usersRes] = await Promise.all([", "const [indRes, usersRes, teamsRes] = await Promise.all([")
content = content.replace("axios.get(Applink.users, { headers })", "axios.get(Applink.users, { headers }),\n        axios.get(Applink.teams, { headers })")

content = content.replace(
    "if (usersRes.data.status === 'success') {", 
    "if (teamsRes.data.status === 'success' || Array.isArray(teamsRes.data)) {\n        const allTeams = Array.isArray(teamsRes.data) ? teamsRes.data : teamsRes.data.data;\n        setTeams(allTeams);\n      }\n\n      if (usersRes.data.status === 'success') {"
)

# 3. Form fields
# Find the CustomDropdown for coach_id and prepend the team dropdown
import re
dropdown_match = re.search(r'<CustomDropdown<string>[\s\S]*?coach_id', content)
if dropdown_match:
    insertion_point = dropdown_match.start()
    # Let's insert the new dropdown inside a new grid
    new_dropdown = '''<div style={{ marginBottom: '16px' }}>
            <CustomDropdown<string>
              label={<><Tag size={16} style={{ display: 'inline', verticalAlign: 'text-bottom' }} /> الفئة / الفريق</>}
              value={formData.team_id}
              onChange={(val) => setFormData({ ...formData, team_id: val })}
              options={teams.map(t => ({
                value: t.id.toString(),
                label: t.name
              }))}
              placeholder="اختر الفئة"
            />
          </div>\n\n          '''
    content = content[:insertion_point] + new_dropdown + content[insertion_point:]

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")
