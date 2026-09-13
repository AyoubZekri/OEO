import os
import re

file_path = 'src/View/Screen/Matches/MatchCallupsDialog.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the temporary no-filter with actual filter
old_code = '''        if (playersRes && (playersRes.data.status === 'success' || Array.isArray(playersRes.data))) {
          const allInds = Array.isArray(playersRes.data) ? playersRes.data : playersRes.data.data;
          // Temporary: show all individuals without filtering, so we can see if the API actually returns data!
          console.log("All Individuals fetched:", allInds);
          setPlayers(allInds || []);
        }'''

new_code = '''        if (playersRes && (playersRes.data.status === 'success' || Array.isArray(playersRes.data))) {
          const allInds = Array.isArray(playersRes.data) ? playersRes.data : playersRes.data.data;
          
          // Filter to show ONLY players (اللاعبين)
          const onlyPlayers = allInds.filter((ind: any) => {
            if (!ind) return false;
            const roleName = ind.role?.name ? ind.role.name.trim() : '';
            return roleName === 'لاعب' || ind.type === 'لاعب' || ind.type === 'player';
          });
          
          setPlayers(onlyPlayers || []);
        }'''

if old_code in content:
    content = content.replace(old_code, new_code)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Replaced successfully")
else:
    print("Old code not found! Here is the file content:")
    print(content[:500])
