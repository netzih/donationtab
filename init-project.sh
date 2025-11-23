#!/bin/bash

# Initialize React Native Android Project
# Run this once before building

set -e

echo "=================================="
echo "Initialize Android Project"
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if already initialized
if [ -f "android/gradlew" ]; then
  echo -e "${GREEN}Android project already initialized!${NC}"
  echo ""
  echo "You can proceed with building:"
  echo "  ./build-and-install.sh"
  exit 0
fi

echo "This will initialize the Android project structure."
echo "This only needs to be done once."
echo ""

# Create android directory if it doesn't exist
mkdir -p android/app

# Detect and add Plesk Node.js paths
echo "Detecting Node.js installation..."

# First, try to auto-detect all Plesk Node.js versions
if [ -d "/opt/plesk/node" ]; then
  # Find all node versions, sort by version number (descending)
  for NODE_DIR in /opt/plesk/node/*/bin; do
    if [ -d "$NODE_DIR" ] && [ -f "$NODE_DIR/node" ]; then
      echo "Found Plesk Node.js at: $NODE_DIR"
      export PATH="$NODE_DIR:$PATH"
    fi
  done
fi

# Also check specific common paths (fallback)
PLESK_PATHS=(
  "/opt/plesk/node/23/bin"
  "/opt/plesk/node/22/bin"
  "/opt/plesk/node/21/bin"
  "/opt/plesk/node/20/bin"
  "/opt/plesk/node/19/bin"
  "/opt/plesk/node/18/bin"
)

# Add specific Plesk paths to PATH if they exist
for PLESK_PATH in "${PLESK_PATHS[@]}"; do
  if [ -d "$PLESK_PATH" ]; then
    # Add to PATH if not already there
    if [[ ":$PATH:" != *":$PLESK_PATH:"* ]]; then
      export PATH="$PLESK_PATH:$PATH"
    fi
  fi
done

# Check for nvm installations
if [ -f "$HOME/.nvm/nvm.sh" ]; then
  echo "Loading nvm..."
  source "$HOME/.nvm/nvm.sh"
  nvm use default 2>/dev/null || nvm use node 2>/dev/null || true
fi

# Function to check if command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Function to find Node.js
find_nodejs() {
  # Try common locations
  local node_locations=(
    "$(command -v node 2>/dev/null)"
    "/opt/plesk/node/23/bin/node"
    "/opt/plesk/node/22/bin/node"
    "/opt/plesk/node/21/bin/node"
    "/opt/plesk/node/20/bin/node"
    "/opt/plesk/node/18/bin/node"
    "/usr/local/bin/node"
    "/usr/bin/node"
    "$HOME/.nvm/versions/node/*/bin/node"
  )

  for node_path in "${node_locations[@]}"; do
    if [ -f "$node_path" ] && [ -x "$node_path" ]; then
      echo "$node_path"
      return 0
    fi
  done

  return 1
}

# Function to find npm
find_npm() {
  local npm_locations=(
    "$(command -v npm 2>/dev/null)"
    "/opt/plesk/node/23/bin/npm"
    "/opt/plesk/node/22/bin/npm"
    "/opt/plesk/node/21/bin/npm"
    "/opt/plesk/node/20/bin/npm"
    "/opt/plesk/node/18/bin/npm"
    "/usr/local/bin/npm"
    "/usr/bin/npm"
    "$HOME/.nvm/versions/node/*/bin/npm"
  )

  for npm_path in "${npm_locations[@]}"; do
    if [ -f "$npm_path" ] && [ -x "$npm_path" ]; then
      echo "$npm_path"
      return 0
    fi
  done

  return 1
}

# Find Node.js
NODE_CMD=""
if command_exists node; then
  NODE_CMD="node"
else
  NODE_PATH=$(find_nodejs)
  if [ -n "$NODE_PATH" ]; then
    NODE_CMD="$NODE_PATH"
    export PATH="$(dirname $NODE_PATH):$PATH"
  fi
fi

if [ -z "$NODE_CMD" ]; then
  echo -e "${RED}✗ Node.js not found${NC}"
  echo ""
  echo "Please install Node.js 18+ or ensure it's in your PATH"
  exit 1
fi

NODE_VERSION=$($NODE_CMD --version)
echo -e "${GREEN}✓ Node.js installed: $NODE_VERSION${NC}"

# Find npm
NPM_CMD=""
if command_exists npm; then
  NPM_CMD="npm"
else
  NPM_PATH=$(find_npm)
  if [ -n "$NPM_PATH" ]; then
    NPM_CMD="$NPM_PATH"
    export PATH="$(dirname $NPM_PATH):$PATH"
  fi
fi

if [ -z "$NPM_CMD" ]; then
  echo -e "${RED}✗ npm not found${NC}"
  echo "npm should be installed with Node.js"
  exit 1
fi

NPM_VERSION=$($NPM_CMD --version)
echo -e "${GREEN}✓ npm installed: v$NPM_VERSION${NC}"

echo ""
echo "Installing npm dependencies..."
$NPM_CMD install

echo ""
echo "Setting up Gradle wrapper..."
echo ""

# Create gradle wrapper directory
mkdir -p android/gradle/wrapper

# Download gradle wrapper jar
echo "Downloading Gradle wrapper..."
curl -L -o android/gradle/wrapper/gradle-wrapper.jar \
  https://raw.githubusercontent.com/gradle/gradle/v8.0.1/gradle/wrapper/gradle-wrapper.jar

# Create gradle-wrapper.properties
cat > android/gradle/wrapper/gradle-wrapper.properties << 'EOF'
distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\://services.gradle.org/distributions/gradle-8.0.1-all.zip
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
EOF

# Create gradlew script (Unix)
cat > android/gradlew << 'EOF'
#!/bin/sh

##############################################################################
# Gradle start up script for UN*X
##############################################################################

# Attempt to set APP_HOME
# Resolve links: $0 may be a link
PRG="$0"
# Need this for relative symlinks.
while [ -h "$PRG" ] ; do
    ls=`ls -ld "$PRG"`
    link=`expr "$ls" : '.*-> \(.*\)$'`
    if expr "$link" : '/.*' > /dev/null; then
        PRG="$link"
    else
        PRG=`dirname "$PRG"`"/$link"
    fi
done
SAVED="`pwd`"
cd "`dirname \"$PRG\"`/" >/dev/null
APP_HOME="`pwd -P`"
cd "$SAVED" >/dev/null

APP_NAME="Gradle"
APP_BASE_NAME=`basename "$0"`

# Add default JVM options here
DEFAULT_JVM_OPTS=""

# Use the maximum available, or set MAX_FD != -1 to use that value.
MAX_FD="maximum"

warn () {
    echo "$*"
}

die () {
    echo
    echo "$*"
    echo
    exit 1
}

# OS specific support (must be 'true' or 'false').
cygwin=false
msys=false
darwin=false
nonstop=false
case "`uname`" in
  CYGWIN* )
    cygwin=true
    ;;
  Darwin* )
    darwin=true
    ;;
  MSYS* | MINGW* )
    msys=true
    ;;
  NONSTOP* )
    nonstop=true
    ;;
esac

CLASSPATH=$APP_HOME/gradle/wrapper/gradle-wrapper.jar

# Determine the Java command to use to start the JVM.
if [ -n "$JAVA_HOME" ] ; then
    if [ -x "$JAVA_HOME/jre/sh/java" ] ; then
        # IBM's JDK on AIX uses strange locations for the executables
        JAVACMD="$JAVA_HOME/jre/sh/java"
    else
        JAVACMD="$JAVA_HOME/bin/java"
    fi
    if [ ! -x "$JAVACMD" ] ; then
        die "ERROR: JAVA_HOME is set to an invalid directory: $JAVA_HOME

Please set the JAVA_HOME variable in your environment to match the
location of your Java installation."
    fi
else
    JAVACMD="java"
    which java >/dev/null 2>&1 || die "ERROR: JAVA_HOME is not set and no 'java' command could be found in your PATH.

Please set the JAVA_HOME variable in your environment to match the
location of your Java installation."
fi

# Increase the maximum file descriptors if we can.
if [ "$cygwin" = "false" -a "$darwin" = "false" -a "$nonstop" = "false" ] ; then
    MAX_FD_LIMIT=`ulimit -H -n`
    if [ $? -eq 0 ] ; then
        if [ "$MAX_FD" = "maximum" -o "$MAX_FD" = "max" ] ; then
            MAX_FD="$MAX_FD_LIMIT"
        fi
        ulimit -n $MAX_FD
        if [ $? -ne 0 ] ; then
            warn "Could not set maximum file descriptor limit: $MAX_FD"
        fi
    else
        warn "Could not query maximum file descriptor limit: $MAX_FD_LIMIT"
    fi
fi

# For Darwin, add options to specify how the application appears in the dock
if [ "$darwin" = "true" ]; then
    GRADLE_OPTS="$GRADLE_OPTS \"-Xdock:name=$APP_NAME\" \"-Xdock:icon=$APP_HOME/media/gradle.icns\""
fi

# For Cygwin or MSYS, switch paths to Windows format before running java
if [ "$cygwin" = "true" -o "$msys" = "true" ] ; then
    APP_HOME=`cygpath --path --mixed "$APP_HOME"`
    CLASSPATH=`cygpath --path --mixed "$CLASSPATH"`

    JAVACMD=`cygpath --unix "$JAVACMD"`

    # We build the pattern for arguments to be converted via cygpath
    ROOTDIRSRAW=`find -L / -maxdepth 1 -mindepth 1 -type d 2>/dev/null`
    SEP=""
    for dir in $ROOTDIRSRAW ; do
        ROOTDIRS="$ROOTDIRS$SEP$dir"
        SEP="|"
    done
    OURCYGPATTERN="(^($ROOTDIRS))"
    # Add a user-defined pattern to the cygpath arguments
    if [ "$GRADLE_CYGPATTERN" != "" ] ; then
        OURCYGPATTERN="$OURCYGPATTERN|($GRADLE_CYGPATTERN)"
    fi
    # Now convert the arguments - kludge to limit ourselves to /bin/sh
    i=0
    for arg in "$@" ; do
        CHECK=`echo "$arg"|egrep -c "$OURCYGPATTERN" -`
        CHECK2=`echo "$arg"|egrep -c "^-"`                                 ### Determine if an option

        if [ $CHECK -ne 0 ] && [ $CHECK2 -eq 0 ] ; then                    ### Added a condition
            eval `echo args$i`=`cygpath --path --ignore --mixed "$arg"`
        else
            eval `echo args$i`="\"$arg\""
        fi
        i=`expr $i + 1`
    done
    case $i in
        0) set -- ;;
        1) set -- "$args0" ;;
        2) set -- "$args0" "$args1" ;;
        3) set -- "$args0" "$args1" "$args2" ;;
        4) set -- "$args0" "$args1" "$args2" "$args3" ;;
        5) set -- "$args0" "$args1" "$args2" "$args3" "$args4" ;;
        6) set -- "$args0" "$args1" "$args2" "$args3" "$args4" "$args5" ;;
        7) set -- "$args0" "$args1" "$args2" "$args3" "$args4" "$args5" "$args6" ;;
        8) set -- "$args0" "$args1" "$args2" "$args3" "$args4" "$args5" "$args6" "$args7" ;;
        9) set -- "$args0" "$args1" "$args2" "$args3" "$args4" "$args5" "$args6" "$args7" "$args8" ;;
    esac
fi

# Escape application args
save () {
    for i do printf %s\\n "$i" | sed "s/'/'\\\\''/g;1s/^/'/;\$s/\$/' \\\\/" ; done
    echo " "
}
APP_ARGS=`save "$@"`

# Collect all arguments for the java command, following the shell quoting and substitution rules
eval set -- $DEFAULT_JVM_OPTS $JAVA_OPTS $GRADLE_OPTS "\"-Dorg.gradle.appname=$APP_BASE_NAME\"" -classpath "\"$CLASSPATH\"" org.gradle.wrapper.GradleWrapperMain "$APP_ARGS"

exec "$JAVACMD" "$@"
EOF

# Create gradlew.bat script (Windows)
cat > android/gradlew.bat << 'EOF'
@rem Gradle startup script for Windows

@rem Set local scope for the variables with windows NT shell
if "%OS%"=="Windows_NT" setlocal

set DIRNAME=%~dp0
if "%DIRNAME%" == "" set DIRNAME=.
set APP_BASE_NAME=%~n0
set APP_HOME=%DIRNAME%

@rem Add default JVM options here
set DEFAULT_JVM_OPTS="-Xmx64m" "-Xms64m"

@rem Find java.exe
if defined JAVA_HOME goto findJavaFromJavaHome

set JAVA_EXE=java.exe
%JAVA_EXE% -version >NUL 2>&1
if "%ERRORLEVEL%" == "0" goto init

echo.
echo ERROR: JAVA_HOME is not set and no 'java' command could be found in your PATH.
goto fail

:findJavaFromJavaHome
set JAVA_HOME=%JAVA_HOME:"=%
set JAVA_EXE=%JAVA_HOME%/bin/java.exe

if exist "%JAVA_EXE%" goto init

echo.
echo ERROR: JAVA_HOME is set to an invalid directory: %JAVA_HOME%
goto fail

:init
@rem Get command-line arguments, handling Windows variants

if not "%OS%" == "Windows_NT" goto win9xME_args

:win9xME_args
@rem Slurp the command line arguments.
set CMD_LINE_ARGS=
set _SKIP=2

:win9xME_args_slurp
if "x%~1" == "x" goto execute

set CMD_LINE_ARGS=%*

:execute
set CLASSPATH=%APP_HOME%\gradle\wrapper\gradle-wrapper.jar

@rem Execute Gradle
"%JAVA_EXE%" %DEFAULT_JVM_OPTS% %JAVA_OPTS% %GRADLE_OPTS% "-Dorg.gradle.appname=%APP_BASE_NAME%" -classpath "%CLASSPATH%" org.gradle.wrapper.GradleWrapperMain %CMD_LINE_ARGS%

:end
@rem End local scope for the variables with windows NT shell
if "%ERRORLEVEL%"=="0" goto mainEnd

:fail
rem Set variable GRADLE_EXIT_CONSOLE if you need the _script_ return code instead of
rem the _cmd.exe /c_ return code!
if  not "" == "%GRADLE_EXIT_CONSOLE%" exit 1
exit /b 1

:mainEnd
if "%OS%"=="Windows_NT" endlocal

:omega
EOF

# Make gradlew executable
chmod +x android/gradlew

echo -e "${GREEN}✓ Gradle wrapper created${NC}"

echo ""
echo "Restoring Android build configuration..."

# Restore Gradle build files from git if they don't exist
if [ ! -f "android/settings.gradle" ] || [ ! -f "android/build.gradle" ] || [ ! -f "android/gradle.properties" ]; then
  echo "Checking out Android config files from git..."
  git checkout android/settings.gradle android/build.gradle android/gradle.properties 2>/dev/null || {
    echo -e "${YELLOW}⚠ Could not restore files from git, they may not exist yet${NC}"
  }
fi

# Check if app/build.gradle exists
if [ ! -f "android/app/build.gradle" ]; then
  echo "Checking out app build.gradle from git..."
  git checkout android/app/build.gradle 2>/dev/null || {
    echo -e "${YELLOW}⚠ Could not restore android/app/build.gradle from git${NC}"
  }
fi

# Check if AndroidManifest.xml exists
if [ ! -f "android/app/src/main/AndroidManifest.xml" ]; then
  echo "Checking out Android source files from git..."
  git checkout android/app/src 2>/dev/null || {
    echo -e "${YELLOW}⚠ Could not restore android/app/src from git${NC}"
  }
fi

echo -e "${GREEN}✓ Android build configuration restored${NC}"

# Verify all files are in place
echo ""
echo "Verifying setup..."

if [ -f "android/gradlew" ]; then
  echo -e "${GREEN}✓ android/gradlew${NC}"
else
  echo -e "${RED}✗ android/gradlew${NC}"
fi

if [ -f "android/gradle/wrapper/gradle-wrapper.jar" ]; then
  echo -e "${GREEN}✓ android/gradle/wrapper/gradle-wrapper.jar${NC}"
else
  echo -e "${RED}✗ android/gradle/wrapper/gradle-wrapper.jar${NC}"
fi

if [ -f "android/gradle/wrapper/gradle-wrapper.properties" ]; then
  echo -e "${GREEN}✓ android/gradle/wrapper/gradle-wrapper.properties${NC}"
else
  echo -e "${RED}✗ android/gradle/wrapper/gradle-wrapper.properties${NC}"
fi

if [ -f "android/settings.gradle" ]; then
  echo -e "${GREEN}✓ android/settings.gradle${NC}"
else
  echo -e "${RED}✗ android/settings.gradle${NC}"
fi

if [ -f "android/build.gradle" ]; then
  echo -e "${GREEN}✓ android/build.gradle${NC}"
else
  echo -e "${RED}✗ android/build.gradle${NC}"
fi

if [ -f "android/app/build.gradle" ]; then
  echo -e "${GREEN}✓ android/app/build.gradle${NC}"
else
  echo -e "${RED}✗ android/app/build.gradle${NC}"
fi

echo ""
echo "=================================="
echo "Initialization Complete!"
echo "=================================="
echo ""
echo "Android project structure is ready."
echo ""
echo "You can now build the APK with:"
echo "  ./build-and-install.sh"
echo ""
