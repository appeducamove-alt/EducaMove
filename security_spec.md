# Security Specification - Profª. Larissa Chaves

## Data Invariants
1. A student cannot exist without a valid Turma ID.
2. Only the authenticated teacher can access data.
3. IA usage is tracked per user to prevent abuse.

## The Dirty Dozen Payloads (Target: DENIED)
1. **Malicious ID**: `turmas/!!!!####` -> Invalid ID format.
2. **Unauthenticated Read**: Attempting to read `alunos` without a token.
3. **Spoofed User Usage**: Attempting to write to `usage/someone_else_id`.
4. **Oversized Student Name**: `alunos` write with a 2MB string as `nome`.
5. **Orphaned Student**: `alunos` write with a non-existent `turmaId`.
6. **Shadow Update**: `turmas` update with `isVerified: true` key.
7. **Negative usage**: Writing `dailyUsage: -100` to `usage`.
8. **Bypassing IA limit**: Client attempting to skip `usage` check (logic in app).
9. **Gabarito Leak**: Unauthenticated access to `provas` collection.
10. **Malicious Pagination**: Sending `limit(100000)` in a query.
11. **Impersonation**: Writing `userId: "actual_teacher_id"` from a different account.
12. **Future Timestamp**: Writing `createdAt` in 2050.

## Logic Verification
- The app uses `isOnSnapshot` and `getDocs` exclusively within `AuthContext` protected boundaries.
- Usage tracking increments on every IA call.
- Rules require `isSignedIn()` for all paths.
