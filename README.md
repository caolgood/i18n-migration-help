# Angular i18n migration helpers

## Migrate .ts files
The following Regex/replace pairs can be dropped into your IDE to automatically migrate most i18n strings. It won't cover strings with placeholders

`(?:this\.)?i18n\([\s\/]*\{[\s\/]*meaning:[\s\n]*'(.*)',[\s\/]*description:[\s\n]*'(.*)',[\s\/]*value:[\s\n]*['`](.*)['`][\s\/]*\}[\s\/]*\)`

\$localize `:$1|$2:$3`

`(?:this\.)?i18n\([\s\/]*\{[\s\/]*meaning:[\s\n]*'(.*)',[\s\/]*value:[\s\n]*['`](.*)['`][\s\/]*\}[\s\/]*\)`

\$localize `:$1:$2`

`(?:this\.)?i18n\([\s\/]*\{[\s\/]*description:[\s\n]*'(.*)',[\s\/]*value:[\s\n]*['`](.*)['`][\s\/]*\}[\s\/]*\)`

\$localize `:$1:$2`

`(?:this\.)?i18n\([\s\/]*\{[\s\/]*value:[\s\n]*'(.*)',[\s\/]*description:[\s\n]*['`](.*)['`][\s\/]*\}[\s\/]*\)`

\$localize `:$2:$1`

`(?:this\.)?i18n\([\s\/]*\{[\s\/]*value:[\s\n]*'(.*)',[\s\/]*meaning:[\s\n]*['`](.*)['`][\s\/]*\}[\s\/]*\)`

\$localize `:$2:$1`

## Migrate existing xlf files
- Open `src/merge-xlf.js` and fill in the required inputs 
- run `yarn xlf-merge`
- You will probably have to keep tweaking your $localize strings, xlf files, or this script itself until you don't get any warnings.
