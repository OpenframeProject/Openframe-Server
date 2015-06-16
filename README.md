# OpenFrame
An open-source platform for displaying digital artwork.

## Technologies


## Data Model

### User Document
```json
{
	"_id" : ObjectId("55270f447d5ea945d9841a9d"),
	"username" : "jonwohl",
	"email" : "jon@jonwohl.com",
	"salt" : "asodif0-29jfa20fjq240fjaq9048uf290384jpfq4oijfpawefa",
	"password" : "2039jajf0249afje00293ja094j230f94j293gh980adfijaso09202i3jr"
}
```

### Content Document
```json
{
	"_id" : ObjectId("553e547bf54ddb6517975d3c"),
	"users" : ["jonwohl"],
	"type" : "image",
	"url" : "http://localhost:8888/static/content/Fields.jpg",
	"tags" : ["japan", "80s"]
}


{
	"_id" : ObjectId("553e547bf54ddb6517975d3c"),
	"users" : ["jonwohl"],
	"type" : "video",
	"url" : "http://localhost:8888/static/content/Fields.jpg",
	"tags" : ["maps", "history"]
}
```

### Frame Document
```json
{
	"_id" : ObjectId("553e547bf54ddb6517975d3c"),
	"owner" : "jonwohl",
	"name" : "Office",
	"active": false,
	"current_content" : {
		"url" : "http://www.skyhdwallpaper.com/wp-content/uploads/2013/09/Nature-Scenes-Wallpaper-10.jpg",
		"users" : [
			"jonwohl"
		],
		"_id" : ObjectId("5556bca0f54ddb1e7a66c757")
	},
	"users" : [
		"jonwohl",
		"ishback"
	],
	"settings" : {
		"width": 1000,
		"height": 1500,
		"w_h_ratio": 0.666666,
		"on_time": "06:30:00",
		"off_time": "17:30:00",
		"rotation": 180,
		"visibility": "public"
	},
	"mirrored_by" : [
		ObjectId("553e547bf54ddb6517975d3a"),
		ObjectId("553e547bf54ddb6517975d3b"),
		ObjectId("553e547bf54ddb6517975d3c"),
		ObjectId("553e547bf54ddb6517975d3d")
	]
}
```