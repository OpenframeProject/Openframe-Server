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
	"users" : ["jonwohl"],
	"type" : "image",
	"url" : "http://localhost:8888/static/content/Fields.jpg"
}


{
	"_id" : ObjectId("553e547bf54ddb6517975d3c"),
	"users" : ["jonwohl"],
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
	"current_content_id": ObjectId("553e547bf54ddb6517975d2s"),
	"users" : [
		"jonwohl",
		"ishback"
	],
	"mirrored_by" : [
		ObjectId("553e547bf54ddb6517975d3a"),
		ObjectId("553e547bf54ddb6517975d3b"),
		ObjectId("553e547bf54ddb6517975d3c"),
		ObjectId("553e547bf54ddb6517975d3d")
	]
}
```