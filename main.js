
var Swiper = require('swiper');
var Emitter = require('emitter');

module.exports = flexforever; 

var uSwipeID = 0;


function flexforever(divValue, reqOptions)
{
	console.log(divValue);

	var self = this;


	if(!reqOptions || !reqOptions.objectSize || !reqOptions.objectSize.width || !reqOptions.objectSize.height)
		throw new Error("Can't use flexforever without options or objectSize");

	//add emitter properties to this object
	Emitter(self);

	//we have the div object -- now we need to inject our swiper object

	//add appropriate classes to our given div
	self.uid = "s" + uSwipeID++;

	self.objectSize = reqOptions.objectSize;

	var swipeBase = self.uid + "-swiper-#@#";
	var swipeConID = swipeBase.replace(/#@#/g, "container");
	var swipeWrapID = swipeBase.replace(/#@#/g, "wrapper");
	
	//console check!
	console.log('Base: ', swipeBase, " contain: ", swipeConID, " wrap: ", swipeWrapID);

	//set the innerHTML of the supplied div to now be setup for swiper integration
	divValue.innerHTML = "<div id=" + swipeConID + " class=\"swiper-container\">" + 
	"<div id=" + swipeWrapID + " class=\"swiper-wrapper\">" + 
	"</div>" +
	"</div>";

	self.borderSize = 1;

	console.log(divValue.innerHTML);

	self.swiper = new Swiper('#' + swipeConID,{
	    //Your options here:
	    onSlideNext : nextSlide,
	    onSlidePrev : previousSlide,
	    // width: reqOptions.width,
	    // height: reqOptions.height,
	    // cssWidthAndHeight : true,
	    // initialSlide : 0,
	    mode: reqOptions.mode || 'horizontal',
	    // loop: true
	    //etc..
	});  

	var slideIDs = 0;
	var totalSlideCount = 5;
	var currentDisplayedSlide = 0;
	var currentPageStartID = 0;

	var highestPage = 0;

	var htmlObjects = {};
	var pageObjects = {};

	var itemsPerRow = function()
	{
		return Math.floor(self.swiper.width/(self.objectSize.width + 2*(self.objectSize.rowMargin || 0 + self.borderSize)));
	}

	var itemsPerColumn = function()
	{
		return Math.floor(self.swiper.height/(self.objectSize.height + 2*(self.objectSize.columnMargin || 0 + self.borderSize)));
	}

	var maxItemsPerPage = function()
	{
		//the number = number holdable in a row * number of columns
		//at least 1 will be created -- old code -- maybe later
		return Math.max(itemsPerRow()*itemsPerColumn(), 0);// 1);
	}

	var internalAddPage = function(slideHTML)
	{
		var slide = self.swiper.createSlide(slideHTML);
		
		slide.sID = slideIDs++;

		slide.append();//insertAfter(0);

		//after add/removing we always reinit
		self.swiper.reInit();

		return slide;
	}

	var getOrCreatePage = function(pID)
	{
		var page = pageObjects[pID];
		// console.log('Fetching page: ', pID, " exists? ", page);

		if(!page)
		{
			//simple outline for each of our pages/slides
			var pageOutline = "<div class=\"flexvcenter\" style=\"border: 1px solid black; height:100%;\"></div>"

			//generate the page using our internal function
			var page = internalAddPage(pageOutline);

			//set page object for this id
			pageObjects[page.sID] = page;

			//keep track of highest known page
			highestPage = Math.max(highestPage, page.sID);

		}
		return page;
	}

	var objectIDToUID = function(idCount)
	{
		return self.uid + "-object-" + idCount;
	}

	var getElement = function(ix)
	{
		var objectUID = objectIDToUID(ix);
		return htmlObjects[objectUID];
	}

	//create an element from scratch (using the given identifier)
	var createElement = function(ix)
	{
		var element = document.createElement('div');
		var objectUID = objectIDToUID(ix);

		element.id = objectUID;
		element.style.width = self.objectSize.width + "px";
		element.style.height = self.objectSize.height + "px";
		element.style.marginLeft = self.objectSize.rowMargin + "px" || 0;
		element.style.marginRight = self.objectSize.rowMargin + "px" || 0;

		element.style.marginTop = self.objectSize.columnMargin + "px" || 0;
		element.style.marginBottom = self.objectSize.columnMargin + "px" || 0;
		element.style.border = (self.borderSize ? (self.borderSize + "px solid black") : 0);

		element.style.overflow = "hidden";

		return element;
	}

	var getOrCreateElement = function(id, innerDiv)
	{
		//Check if we've created an object for this spot already (no dupes)
		var element = getElement(id);
		// if we haven't, we need to fix that
		if(!element && innerDiv)
		{
			//create the html object
			element = createElement(id);

			// console.log('New element: ', id, element);

			//add it to our cache of objects
			htmlObjects[objectIDToUID(id)] = element;

			//then add this little bugger to our page anyways
			innerDiv.appendChild(element);

			//inform someone this happened
			self.emit('elementCreated', element.id, element);
		}
	}

	//we fill a page with as many objects that can fit
	var getOrCreateElements = function(pID, startingID, count)
	{	
		//get the page we want to add it to
		var page = getOrCreatePage(pID);
		var innerDiv = page.firstElementChild;

		//do we clear out the previous occupants?
		var fc = innerDiv.firstChild;

		while( fc ) {
		    innerDiv.removeChild( fc );
		    fc = innerDiv.firstChild;
		}

		//let's add in our objects -- using the count
		for(var i=0; i < count; i++)
		{
			getOrCreateElement(startingID + i, innerDiv);
		}	
	}

	var emitEventForElements = function(eventName, startingID, count)
	{
				//let's add in our objects -- using the count
		for(var i=0; i < count; i++)
		{
			var element = getElement(startingID + i);
			// console.log('Event: ' , eventName,  ' Element: ', (startingID + i), " ele: ", element); 
			self.emit(eventName, element.id, element);
		}	
	}

	var pageElementCount = function(pID)
	{
		//What page are we looking at? If not mentioned, then take the current page
		pID = (pID == undefined ? currentDisplayedSlide : pID);
		
		//grab our page
		var page = pageObjects[pID];

		if(page && page.firstElementChild)
			return page.firstElementChild.children.length;
		else
			throw new Error("Invalid page element count request: ", pID);
	}
	var nextPageID = function()
	{
		return (self.swiper.activeSlide().sID + 1);// % totalSlideCount;
	}

	var previousPageID = function()
	{
		return (self.swiper.activeSlide().sID - 1);
	}

	//we're moving to the next slide
	function nextSlide(sw)
	{
		console.log('Slidin -> 2 steps: ', sw.activeSlide().sID);

		var movedTo = sw.activeSlide().sID;

		// console.log('Choo choo on the next train: ', sw);
		var currentElementCount = pageElementCount(currentDisplayedSlide);

		//hide current, make new visible
		emitEventForElements('elementHidden', currentPageStartID, currentElementCount);

		//how far are we really moving though? Might not just be a single slide (you can scroll multiple by draggin far distances)
		var fullElementCount = sumPageCount(currentDisplayedSlide, movedTo);

		//up our current pointer
		currentPageStartID += fullElementCount;
		currentDisplayedSlide = movedTo;

		//let it be known the our new guys are visible
		emitEventForElements('elementVisible', currentPageStartID, pageElementCount(currentDisplayedSlide));

	}
	function previousSlide(sw)
	{
		console.log('Slidin back: ', sw.activeSlide().sID, ' from ', currentDisplayedSlide);

		var movedTo = sw.activeSlide().sID;

		// console.log('back it up, previous please: ', sw);
		var currentElementCount = pageElementCount(currentDisplayedSlide);

		//hide current, make new visible
		emitEventForElements('elementHidden', currentPageStartID, currentElementCount);

		//how far are we really moving though? Might not just be a single slide (you can scroll multiple by draggin far distances)
		var fullElementCount = sumPageCount(currentDisplayedSlide, movedTo);

		console.log('Current place: ', currentPageStartID);
		console.log('Full count: ', fullElementCount);

		//back we go for our current pointer
		currentPageStartID -= fullElementCount;
		currentDisplayedSlide = movedTo;

		//let it be known the our new guys are visible
		emitEventForElements('elementVisible', currentPageStartID, pageElementCount(currentDisplayedSlide));
	}

	function sumPageCount(startPage, endPage)
	{
		if(startPage == endPage)
		{
			return pageElementCount(startPage);
		}

		var isNegative = (endPage - startPage < 0);
		var lowest = isNegative ? endPage : startPage;
		var highest = isNegative ? startPage : endPage;

		console.log('Summing: ', lowest, ' to ', highest);

		var pageSum = 0;
		for(var i=lowest; i < highest; i++)
		{	
			//add our elements for that page (taking into account how many are in each)
			pageSum += pageElementCount(i);
		}	

		//return the sum of children in all these pages
		return pageSum;
	}

	self.createNewPage = function()
	{

		var currentPage = pageObjects[currentDisplayedSlide];

		if(!currentPage)
		{
			//need to create our page, we don't have anything yet!

			//this wil create teh page
			currentPage = getOrCreatePage(currentDisplayedSlide);

			//how many can we fit on this new page
			var maxIPP = maxItemsPerPage();

			//then put stuff inside of it 
			getOrCreateElements(currentDisplayedSlide, currentPageStartID, maxIPP);

			//we should automatically be setup here
			//the only thing left to do is make them visible!
			emitEventForElements('elementVisible', currentPageStartID, maxIPP);

			return;
		}


		//now we need to create a bunch of objects in the farthest page over
		var nextPID = highestPage + 1;

		//we need to create a bunch of new objects
		//first, how many objects on the current page displayed all the way to the highest page #
		//will search up to but not including the last number so pages 1-3, it will search 1, 2
		var fullElementCount = sumPageCount(currentPage.sID, nextPID)
		var currentElementCount = currentPage.firstElementChild.children.length;

		//the next page starts after all the objects on the pages in between duh
		var nextPageStart = currentPageStartID + fullElementCount;

		//how many can we fit on this new page
		var maxIPP = maxItemsPerPage();

		//let's inform the current batch, they're going to be hidden
		emitEventForElements('elementHidden', currentPageStartID, currentElementCount);

		//we have the page we're going to load things onto, and what we're hoping to create
		//load up all the necessary objects onto this new page
		getOrCreateElements(nextPID, nextPageStart, maxIPP);

		//now we need to officially move to the next page
		self.swiper.swipeTo(nextPID);

		//move our start points for the page, and the objects to our new page
		currentPageStartID = nextPageStart;
		currentDisplayedSlide = nextPID;

		//let all our objects know of their new shiny home 
		emitEventForElements('elementVisible', currentPageStartID, maxIPP);
	}


	self.previousPage = function()
	{
		var desired = currentDisplayedSlide - 1;
		if(desired >= 0)
		{
			//account for changes in our element pointer
			// previousSlide();
			//then move the bugger
			self.swiper.swipePrev();
		}
	}
	self.nextPage = function()
	{
		//going to move to next slide -- fetch ID + 1
		var nPID = self.swiper.activeSlide().sID + 1;

		//don't attempt to move to something that doesn't exist
		if(nPID <= highestPage)
		{
			self.swiper.swipeNext();
		}
	}

	return self;
}



