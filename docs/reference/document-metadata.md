# DocumentMetadata

`DocumentMetadata` describes the explanation as a whole.

Metadata should help users identify, search, and organize explanations. It should not change renderer behavior unless a later contract explicitly says so.

## Shape

```ts
type DocumentMetadata = {
  id?: string;
  title: string;
  description?: string;
  author?: string;
  createdAt?: string;
  updatedAt?: string;
  domain?: string;
  tags?: string[];
};
```

## Fields

### id

Optional stable identifier for the document.

### title

Human-readable title for the explanation.

### description

Short summary of what the explanation covers.

### author

The human, agent, or system that authored the document.

### createdAt

Creation timestamp.

### updatedAt

Last update timestamp.

### domain

Descriptive domain label such as `codebase`, `debugging`, `architecture`, `operations`, or `economics`.

### tags

Search and grouping labels.

## Open Questions

- Should timestamps require ISO 8601?
- Should `domain` be a free-form string or a recommended vocabulary?
- Should `author` be structured instead of a string?
