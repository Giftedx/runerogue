"""
RuneRogue - A Python web scraping application with multi-fallback patterns
"""

from setuptools import find_packages, setup

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

setup(
    name="runerogue",
    version="1.0.0",
    author="RuneRogue Team",
    author_email="team@runerogue.com",
    description="A Python web scraping application with multi-fallback patterns",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/Giftedx/runerogue",
    packages=find_packages(),
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
    ],
    python_requires=">=3.8",
    install_requires=[
        "Flask>=2.0.0",
        "PyYAML>=6.0",
        "requests>=2.25.0",
        "beautifulsoup4>=4.9.0",
        "playwright>=1.20.0",
        "boto3>=1.20.0",
        "sendgrid>=6.9.0",
        "psutil>=5.8.0",
    ],
    extras_require={
        "dev": [
            "flake8>=5.0.0",
            "pytest>=7.0.0",
            "pytest-mock>=3.8.0",
            "pytest-cov>=4.0.0",
            "black>=22.0.0",
            "isort>=5.10.0",
        ],
    },
    entry_points={
        "console_scripts": [
            "runerogue=app:main",
        ],
    },
)
