const items = require('../features/data.json');
	
function filterForCategory(category){
	var filtered = items
	if(category!== 'nocategory'){
		filtered = items.filter((item)=>{
		return item.category.toLowerCase() === category;
		})	
		
	}
	console.log(filtered)
	console.log('found ' + filtered.length)
	
}

filterForCategory('automotive')

function filterForBrand(brand){
	filtered = items.filter((item)=>{
		var total = item.title + ' ' + item.description
		return total.toLowerCase().includes(brand.toLowerCase())
	})
	console.log(filtered)
	console.log('found ' + filtered.length)
}

