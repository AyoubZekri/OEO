import os

file_path = 'src/View/Screen/Matches/MatchCallupsDialog.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

old_filter = '''// Filter to show ONLY players (اللاعبين)
        const onlyPlayers = allInds.filter((ind: any) => {
          if (!ind) return false;
          const roleName = ind.role?.name ? ind.role.name.trim() : '';
          return roleName === 'لاعب' || ind.type === 'لاعب' || ind.type === 'player';
        });'''

new_filter = '''// Filter to show ONLY players (اللاعبين) and belong to the match team
        const onlyPlayers = allInds.filter((ind: any) => {
          if (!ind) return false;
          const roleName = ind.role?.name ? ind.role.name.trim() : '';
          const isPlayer = roleName === 'لاعب' || ind.type === 'لاعب' || ind.type === 'player';
          
          // Filter by match team_id if the match has one assigned
          const matchTeamId = matchData?.team_id;
          const playerTeamId = ind.team_id || ind.team?.id;
          
          if (matchTeamId) {
            return isPlayer && playerTeamId === matchTeamId;
          }
          return isPlayer;
        });'''

content = content.replace(old_filter, new_filter)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")
