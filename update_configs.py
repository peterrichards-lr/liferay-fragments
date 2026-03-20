import json
import os
import glob

def process_file(file_path):
    with open(file_path, 'r') as f:
        try:
            data = json.load(f)
        except json.JSONDecodeError:
            print(f"Error decoding JSON in {file_path}")
            return

    modified = False
    if 'fieldSets' in data:
        for fs in data['fieldSets']:
            if 'fields' in fs:
                for field in fs['fields']:
                    # 1. Handle defaultValue
                    if 'defaultValue' in field:
                        val = field['defaultValue']
                        # Check if it's a number (int or float) and NOT a boolean
                        if isinstance(val, (int, float)) and not isinstance(val, bool):
                            field['defaultValue'] = str(val)
                            modified = True
                    
                    # Also check dataType if present, although the user mostly cares about the value itself
                    # If dataType is int/float but defaultValue is a number, the above handles it.
                    
                    # 2. Handle text fields with min/max in typeOptions
                    if field.get('type') == 'text' and 'typeOptions' in field:
                        to = field['typeOptions']
                        if 'min' in to or 'max' in to:
                            validation = to.get('validation', {})
                            if 'min' in to:
                                validation['min'] = to.pop('min')
                            if 'max' in to:
                                validation['max'] = to.pop('max')
                            validation['type'] = 'number'
                            to['validation'] = validation
                            modified = True
    
    if modified:
        with open(file_path, 'w') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
            f.write('\n')
        print(f"Updated {file_path}")

def main():
    config_files = glob.glob('**/configuration.json', recursive=True)
    for file_path in config_files:
        process_file(file_path)

if __name__ == "__main__":
    main()
