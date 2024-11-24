import os
import matplotlib
import matplotlib.pyplot as plt
import re

# Use a non-interactive backend
matplotlib.use('Agg')

code_file_path = 'gpt_code_output.py'
graph_file_path = 'graph_output.png'

# Check if the code output file exists
if os.path.exists(code_file_path):
    with open(code_file_path, 'r') as file:
        code_output = file.read().strip()

    # Clean up the code to remove ```python and ``` delimiters if they exist
    if code_output.startswith("```python"):
        code_output = code_output[9:]  # Remove leading ```python
    if code_output.endswith("```"):
        code_output = code_output[:-3]  # Remove trailing ```

    # Replace calls to plt.show() with plt.savefig()
    code_output = re.sub(r'plt\.show\s*\(\s*\)', f"plt.savefig('{graph_file_path}')", code_output)
    
    # Replace calls to display() with a warning or alternative
    code_output = re.sub(r'display\s*\(', "print('Display function call intercepted: ', ", code_output)

    exec_locals = {}
    captured_output = []  # List to capture all output from print statements

    # Override the built-in print to capture printed output
    def custom_print(*args, **kwargs):
        output = " ".join(map(str, args))
        captured_output.append(output)

    try:
        # Execute the GPT-generated code
        exec(code_output, globals(), {**exec_locals, "print": custom_print})
    except Exception as e:
        # print(f"Error executing code: {e}")
        print(f"Network error. Please try again in a moment.")
    else:
        # If no captured output but a graph exists, save the graph
        if plt.get_fignums():  # Check if any figures exist
            plt.savefig(graph_file_path)  # Save the graph to the specified path
            plt.close('all')  # Close all figures to prevent warnings
            print(f"Graph saved to {graph_file_path}")
        elif not captured_output:  # Only print fallback message if no output
            print("No graph generated. Code executed successfully without a returnable result.")
        else:
            # Print captured output if it exists
            for output in captured_output:
                print(output)
else:
    print(f"Error: {code_file_path} not found. Ensure that the code is saved in this file.")

# Cleanup: Remove the code file after execution
if os.path.exists(code_file_path):
    os.remove(code_file_path)
