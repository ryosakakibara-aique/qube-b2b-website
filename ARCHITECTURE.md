# ARCHITECTURE

                    NEXT.JS
                       │
           ┌───────────┴───────────┐
           │                       │
       MARKETING                   CMS
           │                       │
     ┌─────┴─────┐          ┌─────┴─────────┐
     │           │          │               │
     /        /products    /cms          /cms/login
                   │          │
                   ▼          ▼
            /products/[id]  /cms/products
                                  │
                    ┌─────────────┼─────────────┐
                    ▼             ▼             ▼
                 create        [product]     [product]/edit
