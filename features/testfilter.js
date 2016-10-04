const items = require('../features/data.json');

function filterForCategory(category){

	filtered = items.filter((item)=>{
		return item.category.toLowerCase() === category;
	})
	console.log(filtered)
}

filterForCategory('computers')