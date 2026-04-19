#!/bin/bash

# Post-write code hook - runs pnpm quality to verify changes
# This hook runs after Cascade modifies code files

input=$(cat)
file_path=$(echo "$input" | grep -o '"file_path": "[^"]*"' | cut -d'"' -f4)

# Only run quality checks on TypeScript/JavaScript/CSS/HTML files
if [[ "$file_path" =~ \.(ts|js|mjs|cjs|css|scss|html|json)$ ]]; then
    # Check if pnpm is available and we're in the project root
    if command -v pnpm &> /dev/null && [ -f "package.json" ]; then
        echo "Running lightweight quality checks for: $file_path"
        
        # Run pnpm quality:light
        if pnpm quality:light; then
            echo "✓ Quality checks passed"
            exit 0
        else
            echo "✗ Quality checks failed" >&2
            exit 1
        fi
    fi
fi

exit 0
