import json
import os
import glob

def find_unnested_validation(file_path):
    with open(file_path, 'r') as f:
        try:
            data = json.load(f)
        except json.JSONDecodeError:
            return

    if 'fieldSets' in data:
        for fs in data['fieldSets']:
            if 'fields' in fs:
                for field in fs['fields']:
                    if 'typeOptions' in field:
                        to = field['typeOptions']
                        if 'min' in to or 'max' in to:
                            if 'validation' not in to:
                                print(f"FOUND: {file_path}")
                                return

def main():
    config_files = glob.glob('**/configuration.json', recursive=True)
    for file_path in config_files:
        find_unnested_validation(file_path)

if __name__ == "__main__":
    main()
