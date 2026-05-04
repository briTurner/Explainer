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

Optional stable identifier for the document. Systems that persist or share documents may require IDs at their own boundaries, but the core protocol does not.

### title

Human-readable title for the explanation.

### description

Short summary of what the explanation covers.

### author

The human, agent, or system that authored the document. `author` is a simple string in v1.

### createdAt

Creation timestamp. If present, this must be an ISO 8601 string.

### updatedAt

Last update timestamp. If present, this must be an ISO 8601 string.

### domain

Free-form descriptive domain label such as `codebase`, `debugging`, `architecture`, `operations`, or `economics`.

Domain values are descriptive, not behavioral. Documentation may recommend common values, but the protocol does not require a fixed vocabulary.

### tags

Search and grouping labels.
