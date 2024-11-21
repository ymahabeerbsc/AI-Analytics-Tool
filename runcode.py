# runcode.py

import os

code_file_path = 'gpt_code_output.py'

# Check if the code output file exists
if os.path.exists(code_file_path):
    with open(code_file_path, 'r') as file:
        code_output = file.read().strip()

    # Clean up the code to remove ```python and ``` delimiters if they exist
    if code_output.startswith("```python"):
        code_output = code_output[9:]  # Remove leading ```python
    if code_output.endswith("```"):
        code_output = code_output[:-3]  # Remove trailing ```

    exec_locals = {}
    try:
        exec(code_output, globals(), exec_locals)
    except Exception as e:
        print(f"Error executing code: {e}")
    else:
        # Get a specific result if needed, otherwise print general success message
        result = exec_locals.get('result_variable')  # Replace with actual variable if known
        if result is not None:
            print(result)  # Print result for server.js to capture
        # else:
        #     print("Code executed successfully without a returnable result.")
else:
    print(f"Error: {code_file_path} not found. Ensure that the code is saved in this file.")
