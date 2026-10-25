1 markup pairs x 3 parents x 2 widths = 6 renders, 4 different

| case | parent | width | old box | new box | old text line box | new text line box | font (old → new) | colour | result |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| negative control: the previous head's span without `block` | page default 16px/24px | 1440 | 320x68 | 320x72 | 93x15 at +113,+26 | 93x15 at +113,+29 | 14px/20px 400 "Times New Roman" | rgb(113, 113, 122) | **DIFFERENT** |
| negative control: the previous head's span without `block` | page default 16px/24px | 390 | 320x68 | 320x72 | 93x15 at +113,+26 | 93x15 at +113,+29 | 14px/20px 400 "Times New Roman" | rgb(113, 113, 122) | **DIFFERENT** |
| negative control: the previous head's span without `block` | leading-[30px] parent | 1440 | 320x68 | 320x78 | 93x15 at +113,+26 | 93x15 at +113,+32 | 14px/20px 400 "Times New Roman" | rgb(113, 113, 122) | **DIFFERENT** |
| negative control: the previous head's span without `block` | leading-[30px] parent | 390 | 320x68 | 320x78 | 93x15 at +113,+26 | 93x15 at +113,+32 | 14px/20px 400 "Times New Roman" | rgb(113, 113, 122) | **DIFFERENT** |
| negative control: the previous head's span without `block` | 14px/20px parent | 1440 | 320x68 | 320x68 | 93x15 at +113,+26 | 93x15 at +113,+26 | 14px/20px 400 "Times New Roman" | rgb(113, 113, 122) | identical |
| negative control: the previous head's span without `block` | 14px/20px parent | 390 | 320x68 | 320x68 | 93x15 at +113,+26 | 93x15 at +113,+26 | 14px/20px 400 "Times New Roman" | rgb(113, 113, 122) | identical |
