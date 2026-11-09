UPDATE users
SET password_hash = 'scrypt:6469656c2d666978747572652d7631:120494ae69867f80321c67e6b696ae9076bee044979168fc42dd4391fb88f51c'
WHERE password_hash = 'change-me';
