# Database ER Diagram

```mermaid
erDiagram
    ORGANIZATION ||--o{ TENANT : contains
    ORGANIZATION ||--o{ MEMBERSHIP : has
    USER ||--o{ MEMBERSHIP : belongs_to
    ORGANIZATION ||--o{ BOARD : owns
    TENANT ||--o{ BOARD : contains
    BOARD ||--o{ COLUMN : contains
    COLUMN ||--o{ TASK : contains
    USER ||--o{ TASK : creates
