#!/usr/bin/env python3
"""
Basic validation test for Where2Meet M2 server.
Tests file structure and Python syntax without requiring dependencies.
"""

import sys
import os
import ast
from pathlib import Path

def test_python_syntax():
    """Test Python syntax for all files."""
    print("=" * 70)
    print("TEST 1: Python Syntax Validation")
    print("=" * 70)

    py_files = list(Path("app").rglob("*.py"))
    errors = []
    warnings = []

    for py_file in py_files:
        try:
            with open(py_file, 'r', encoding='utf-8') as f:
                code = f.read()
                ast.parse(code)
            print(f"✅ {py_file}")
        except SyntaxError as e:
            print(f"❌ {py_file}: Line {e.lineno}: {e.msg}")
            errors.append((py_file, e))
        except Exception as e:
            print(f"⚠️  {py_file}: {e}")
            warnings.append((py_file, e))

    print(f"\n📊 Results: {len(py_files)} files checked")
    print(f"   ✅ Passed: {len(py_files) - len(errors) - len(warnings)}")
    if warnings:
        print(f"   ⚠️  Warnings: {len(warnings)}")
    if errors:
        print(f"   ❌ Errors: {len(errors)}")
        return False
    return True


def test_file_structure():
    """Test required files and directories exist."""
    print("\n" + "=" * 70)
    print("TEST 2: File Structure Validation")
    print("=" * 70)

    required_structure = {
        "files": [
            "requirements.txt",
            "docker-compose.yml",
            "alembic.ini",
            "setup.sh",
            "README.md",
            ".env.example",
            "app/main.py",
            "app/__init__.py",
            "app/core/config.py",
            "app/core/security.py",
            "app/core/__init__.py",
            "app/db/base.py",
            "app/db/__init__.py",
            "app/models/event.py",
            "app/models/__init__.py",
            "app/schemas/event.py",
            "app/schemas/__init__.py",
            "app/api/__init__.py",
            "app/api/v1/__init__.py",
            "app/api/v1/events.py",
            "app/api/v1/participants.py",
            "app/api/v1/candidates.py",
            "app/api/v1/votes.py",
            "app/api/v1/sse.py",
            "app/services/__init__.py",
            "app/services/algorithms.py",
            "app/services/google_maps.py",
            "app/services/sse.py",
            "alembic/env.py",
            "alembic/script.py.mako",
        ],
        "directories": [
            "app",
            "app/api",
            "app/api/v1",
            "app/core",
            "app/db",
            "app/models",
            "app/schemas",
            "app/services",
            "alembic",
            "alembic/versions",
        ]
    }

    # Check directories
    print("\n📁 Checking directories...")
    missing_dirs = []
    for directory in required_structure["directories"]:
        path = Path(directory)
        if path.is_dir():
            print(f"✅ {directory}/")
        else:
            print(f"❌ {directory}/ - MISSING")
            missing_dirs.append(directory)

    # Check files
    print("\n📄 Checking files...")
    missing_files = []
    for file in required_structure["files"]:
        path = Path(file)
        if path.is_file():
            size = path.stat().st_size
            print(f"✅ {file} ({size} bytes)")
        else:
            print(f"❌ {file} - MISSING")
            missing_files.append(file)

    # Summary
    total_dirs = len(required_structure["directories"])
    total_files = len(required_structure["files"])
    print(f"\n📊 Results:")
    print(f"   Directories: {total_dirs - len(missing_dirs)}/{total_dirs}")
    print(f"   Files: {total_files - len(missing_files)}/{total_files}")

    if missing_dirs or missing_files:
        print(f"\n❌ Missing {len(missing_dirs)} directories and {len(missing_files)} files")
        return False
    return True


def test_code_metrics():
    """Analyze code metrics."""
    print("\n" + "=" * 70)
    print("TEST 3: Code Metrics Analysis")
    print("=" * 70)

    py_files = list(Path("app").rglob("*.py"))
    total_lines = 0
    total_code_lines = 0
    total_comment_lines = 0
    total_blank_lines = 0

    file_stats = []

    for py_file in py_files:
        try:
            with open(py_file, 'r', encoding='utf-8') as f:
                lines = f.readlines()
                code = 0
                comments = 0
                blank = 0

                for line in lines:
                    stripped = line.strip()
                    if not stripped:
                        blank += 1
                    elif stripped.startswith('#'):
                        comments += 1
                    else:
                        code += 1

                total_lines += len(lines)
                total_code_lines += code
                total_comment_lines += comments
                total_blank_lines += blank

                file_stats.append((py_file, len(lines), code))
        except Exception as e:
            print(f"⚠️  Could not analyze {py_file}: {e}")

    # Sort by lines of code
    file_stats.sort(key=lambda x: x[2], reverse=True)

    print("\n📈 Top 10 files by code lines:")
    for i, (file, total, code) in enumerate(file_stats[:10], 1):
        print(f"   {i:2d}. {str(file):40s} - {code:4d} lines")

    print(f"\n📊 Overall Metrics:")
    print(f"   Total files:        {len(py_files)}")
    print(f"   Total lines:        {total_lines:,}")
    print(f"   Code lines:         {total_code_lines:,} ({total_code_lines/total_lines*100:.1f}%)")
    print(f"   Comment lines:      {total_comment_lines:,} ({total_comment_lines/total_lines*100:.1f}%)")
    print(f"   Blank lines:        {total_blank_lines:,} ({total_blank_lines/total_lines*100:.1f}%)")
    print(f"   Avg lines per file: {total_lines/len(py_files):.1f}")

    return True


def test_imports_structure():
    """Check import statements in files."""
    print("\n" + "=" * 70)
    print("TEST 4: Import Statement Analysis")
    print("=" * 70)

    py_files = [f for f in Path("app").rglob("*.py") if f.name != "__init__.py"]

    third_party_imports = set()
    local_imports = set()

    for py_file in py_files:
        try:
            with open(py_file, 'r', encoding='utf-8') as f:
                tree = ast.parse(f.read())

            for node in ast.walk(tree):
                if isinstance(node, ast.Import):
                    for alias in node.names:
                        if alias.name.startswith('app.'):
                            local_imports.add(alias.name.split('.')[1])
                        else:
                            third_party_imports.add(alias.name.split('.')[0])
                elif isinstance(node, ast.ImportFrom):
                    if node.module and node.module.startswith('app.'):
                        local_imports.add(node.module.split('.')[1])
                    elif node.module:
                        third_party_imports.add(node.module.split('.')[0])
        except Exception as e:
            print(f"⚠️  Could not analyze imports in {py_file}: {e}")

    print("\n📦 Third-party packages used:")
    for pkg in sorted(third_party_imports):
        if pkg not in ['sys', 'os', 'json', 'datetime', 'typing', 'collections']:
            print(f"   • {pkg}")

    print(f"\n🔗 Local app modules used:")
    for mod in sorted(local_imports):
        print(f"   • app.{mod}")

    return True


def test_docstrings():
    """Check for docstrings in modules and functions."""
    print("\n" + "=" * 70)
    print("TEST 5: Documentation Quality Check")
    print("=" * 70)

    py_files = [f for f in Path("app").rglob("*.py") if f.name != "__init__.py"]

    total_modules = 0
    modules_with_docs = 0
    total_functions = 0
    functions_with_docs = 0

    for py_file in py_files:
        try:
            with open(py_file, 'r', encoding='utf-8') as f:
                tree = ast.parse(f.read())

            # Check module docstring
            total_modules += 1
            if ast.get_docstring(tree):
                modules_with_docs += 1

            # Check function docstrings
            for node in ast.walk(tree):
                if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                    total_functions += 1
                    if ast.get_docstring(node):
                        functions_with_docs += 1

        except Exception as e:
            print(f"⚠️  Could not analyze {py_file}: {e}")

    module_pct = modules_with_docs / total_modules * 100 if total_modules > 0 else 0
    func_pct = functions_with_docs / total_functions * 100 if total_functions > 0 else 0

    print(f"\n📝 Documentation Coverage:")
    print(f"   Modules:   {modules_with_docs:3d}/{total_modules:3d} ({module_pct:.1f}%)")
    print(f"   Functions: {functions_with_docs:3d}/{total_functions:3d} ({func_pct:.1f}%)")

    return True


def main():
    """Run all basic tests."""
    print("\n" + "=" * 70)
    print("WHERE2MEET M2 SERVER - BASIC VALIDATION TEST")
    print("=" * 70)
    print("Testing without requiring dependencies to be installed")
    print("=" * 70 + "\n")

    tests = [
        ("Python Syntax", test_python_syntax),
        ("File Structure", test_file_structure),
        ("Code Metrics", test_code_metrics),
        ("Import Analysis", test_imports_structure),
        ("Documentation", test_docstrings),
    ]

    results = []
    for name, test_func in tests:
        try:
            result = test_func()
            results.append((name, result))
        except Exception as e:
            print(f"\n❌ Test '{name}' crashed: {e}")
            import traceback
            traceback.print_exc()
            results.append((name, False))

    # Summary
    print("\n" + "=" * 70)
    print("TEST SUMMARY")
    print("=" * 70)

    passed = sum(1 for _, result in results if result)
    total = len(results)

    for name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}: {name}")

    print(f"\n📊 Overall: {passed}/{total} tests passed ({passed/total*100:.1f}%)")

    if passed == total:
        print("\n🎉 ALL BASIC TESTS PASSED!")
        print("✨ Server code structure and syntax are correct.")
        print("\n📋 Next steps:")
        print("   1. Install dependencies: pip install -r requirements.txt")
        print("   2. Start Docker services: docker-compose up -d")
        print("   3. Run migrations: alembic upgrade head")
        print("   4. Start server: uvicorn app.main:app --reload")
        return 0
    else:
        print(f"\n⚠️  {total - passed} test(s) failed. Please review errors above.")
        return 1


if __name__ == "__main__":
    sys.exit(main())
