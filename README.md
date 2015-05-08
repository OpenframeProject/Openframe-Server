# OpenFrame
An open-source platform for displaying digital artwork.

### User Document
```json
{
	"_id" : ObjectId("55270f447d5ea945d9841a9d"),
	"username" : "jonwohl",
	"email" : "jon@jonwohl.com"
}
```

### Content Document
```json
{
	"_id" : ObjectId("553e547bf54ddb6517975d3c"),
	"username" : "jonwohl",
	"type" : "image",
	"url" : "http://localhost:8888/static/content/Fields.jpg"
}


{
	"_id" : ObjectId("553e547bf54ddb6517975d3c"),
	"username" : "jonwohl",
	"type" : "video",
	"url" : "http://localhost:8888/static/content/Fields.jpg"
}
```

### Frame Document
```json
{
	"_id" : ObjectId("553e547bf54ddb6517975d3c"),
	"owner" : "jonwohl",
	"name" : "Office",
	"active": false,
	"users" : [
		"jonwohl",
		"ishback"
	]
}
```