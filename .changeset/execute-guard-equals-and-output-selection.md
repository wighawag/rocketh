---
'@rocketh/read-execute': minor
---

`execute` guards gain `equals`, sugar over `satisfied` that compares the value the way its ABI type says the value means (`address` and `bytesN` fold case, `string` does not, a bigint never coerces against a number, arrays and tuples compare elementwise), plus `output` to select one of the read function's declared outputs by name or position. The evaluation record now reports the whole value read, the selected value and the expected one.
