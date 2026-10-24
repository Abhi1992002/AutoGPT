GlobalSearchModal > "hoists navigation above search results on an exact name match"

Targeted runs: dev ends with 9 DOM states, head with 10. head[:9] == dev[:9] exactly.
The 10th state is the "Searching" spinner of the 200 ms debounced fetch (useGlobalSearch.ts DEBOUNCE_MS),
which fires after the test's last assertion and before teardown when the test runs a little longer.
dev's own full-suite run ended in the identical spinner state:
  final(dev full-suite run) == final(head targeted run 1) == final(head targeted run 2): True
So both commits reach the same DOM; which one is caught at teardown is timing.
