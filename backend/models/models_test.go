package models

import (
	"strings"
	"testing"
)

func TestRandomCodeLengthAndAlphabet(t *testing.T) {
	for _, n := range []int{4, 6} {
		for i := 0; i < 200; i++ {
			code, err := randomCode(n)
			if err != nil {
				t.Fatalf("randomCode(%d): %v", n, err)
			}
			if len(code) != n {
				t.Fatalf("randomCode(%d) = %q, want length %d", n, code, n)
			}
			for _, r := range code {
				if !strings.ContainsRune(codeAlphabet, r) {
					t.Fatalf("randomCode(%d) = %q contains %q outside alphabet", n, code, r)
				}
			}
		}
	}
}

// Codes are read aloud and typed on phones, so I and O must never appear.
func TestCodeAlphabetSkipsAmbiguousLetters(t *testing.T) {
	if strings.ContainsAny(codeAlphabet, "IO") {
		t.Fatalf("codeAlphabet %q contains I or O", codeAlphabet)
	}
}
