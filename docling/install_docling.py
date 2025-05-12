#!/usr/bin/env python3
"""
Docling Installation Helper
This script checks if Docling is installed and installs it if it's not.
"""

import sys
import subprocess
import importlib.util
import os

def check_package(package_name):
    """Check if a Python package is installed"""
    spec = importlib.util.find_spec(package_name)
    return spec is not None

def install_package(package_name, version=None):
    """Install a Python package using pip"""
    package_spec = f"{package_name}=={version}" if version else package_name
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", package_spec])
        print(f"Successfully installed {package_spec}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error installing {package_spec}: {e}")
        return False

def main():
    """Main function to check and install Docling"""
    print("===== Docling Installation Helper =====")
    
    # Check if Docling is already installed
    if check_package("docling"):
        print("✅ Docling is already installed.")
        try:
            import docling
            print(f"Docling version: {docling.__version__}")
        except (ImportError, AttributeError):
            print("Could not determine Docling version.")
    else:
        print("🔍 Docling is not installed. Attempting to install...")
        
        # First, ensure pip is up to date
        subprocess.call([sys.executable, "-m", "pip", "install", "--upgrade", "pip"])
        
        # Install Docling with its dependencies
        if install_package("docling", "2.17.0"):
            print("✅ Successfully installed Docling!")
        else:
            print("❌ Failed to install Docling.")
            print("\nPlease try to install it manually with:")
            print(f"    {sys.executable} -m pip install docling==2.17.0")
    
    # Check for important dependencies
    dependencies = [
        "torch",
        "transformers",
        "numpy",
        "pillow",
        "pypdfium2",
    ]
    
    print("\nChecking for important dependencies:")
    for dep in dependencies:
        if check_package(dep):
            print(f"✅ {dep} is installed")
        else:
            print(f"❌ {dep} is missing. Consider installing it with:")
            print(f"    {sys.executable} -m pip install {dep}")
    
    print("\n===== Installation Check Complete =====")
    print("If you're having issues, please refer to the documentation at:")
    print("https://ds4sd.github.io/docling/installation/")

if __name__ == "__main__":
    main() 