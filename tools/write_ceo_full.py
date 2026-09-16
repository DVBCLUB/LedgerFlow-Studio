import os, sys

base = os.path.normpath(os.path.join(os.path.dirname(__file__), '..'))
target = os.path.join(base, 'src', 'components', 'command', 'CEOCommandCenter.tsx')

# Read content from stdin
content = sys.stdin.read()
with open(target, 'w', encoding='utf-8') as f:
    f.write(content)
print(f'Written {len(content)} bytes to {target}')
