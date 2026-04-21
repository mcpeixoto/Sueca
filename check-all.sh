#!/usr/bin/env bash
# Unified check script for all stacks
# Usage: ./check-all.sh [--fix]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FIX_MODE=false

if [[ "$1" == "--fix" ]]; then
    FIX_MODE=true
fi

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_header() {
    echo -e "\n${BLUE}=====================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}=====================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}! $1${NC}"
}

ERRORS=0

# =====================
# Go Backend
# =====================
print_header "Go Backend (backend)"

if command -v go &> /dev/null; then
    cd "$SCRIPT_DIR/backend"

    echo "Running go fmt..."
    if $FIX_MODE; then
        go fmt ./... || { print_error "go fmt failed"; ((ERRORS++)); }
    fi
    print_success "go fmt completed"

    echo "Running go vet..."
    go vet ./... || { print_error "go vet failed"; ((ERRORS++)); }
    print_success "go vet completed"

    if command -v golangci-lint &> /dev/null; then
        echo "Running golangci-lint..."
        golangci-lint run || { print_error "golangci-lint failed"; ((ERRORS++)); }
        print_success "golangci-lint completed"
    else
        print_warning "golangci-lint not found. Install: go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest"
    fi

    echo "Running go test..."
    go test -v -short ./... || { print_error "go test failed"; ((ERRORS++)); }
    print_success "go test completed"

    cd "$SCRIPT_DIR"
else
    print_warning "go not found, skipping Go checks"
fi

# =====================
# Frontend (static assets — syntax sanity only)
# =====================
print_header "Frontend (static HTML/JSX)"

if [[ -d "$SCRIPT_DIR/frontend/public" ]]; then
    if command -v node &> /dev/null; then
        echo "Validating JS files parse..."
        for f in "$SCRIPT_DIR/frontend/public"/*.js; do
            [ -e "$f" ] || continue
            node --check "$f" || { print_error "JS syntax error in $f"; ((ERRORS++)); }
        done
        print_success "JS syntax validated"
    else
        print_warning "node not found, skipping JS syntax check"
    fi
    print_success "Frontend check completed"
else
    print_warning "frontend/public directory missing"
fi

# =====================
# Summary
# =====================
print_header "Summary"

if [[ $ERRORS -eq 0 ]]; then
    print_success "All checks passed!"
    exit 0
else
    print_error "$ERRORS check(s) failed"
    exit 1
fi
