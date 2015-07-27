var express = 		require('express')
  ,	bodyParser = 	require('body-parser')
  ,	couchbase = 	require('./routes/couchbase');
				 	require('date-utils');

var CouchCnt = new couchbase();
var app = express();
var nowyear = new Date().toFormat("YYYY");

app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine', 'jade');
app.set('views', __dirname + '/views');

app.get('/', function(req, res){
	res.render('index', {title: '作業日報', year: nowyear});
});


app.get('/list', function(req, res){
	CouchCnt.getView(function(err,View){
		if(err){
			res.render('err', {title: 'エラー'});
			return;
		}
		var ArrayView = new Array();
		var Arraynum = 0;
		for(var i = 0; i < View.length; i++){
    	
    		var json = {
    		id: View[i].id,
    		create_date: View[i].key,
    		value: View[i].value
    		};
    		
    		ArrayView[i] = json;
    	};
		res.render('list', {title: '履歴' , histry: ArrayView});
	});
});

app.get('/list/:id', function(req, res){
	CouchCnt.ShowKeyContent(req.params.id, function(err, json){
		res.render('showlist', {title: json.Period_title, json: json});
	});
});


app.post('/', function(req,res){
	var nowdate = new Date().toFormat("YYYY/MM/DD");
	var json = req.body;
	var classification = json.Period_classification;
	if(json.Period_title == '') json.Period_title = '無題';
	if(! classification) classification = '無し';
	if(! Array.isArray(classification)) classification = [classification];
	json.Period_classification = classification;
	json.type = "report"
	json.Period_start = json.Period_start_year + '年' + json.Period_start_month + '月' + json.Period_start_day + '日';
	json.Period_end = json.Period_end_year + '年' + json.Period_end_month + '月' + json.Period_end_day + '日';
	json.createdate = nowdate;
	
	console.log(json);
	
	CouchCnt.save(json,function(err,couchres){
		if(err){
			res.render('err', {title: 'エラー'});
			return;
		}
		CouchCnt.getView(function(err,View){}); 	//一度見に行かないと更新されない（なぜ？)
		res.render('index', {title: '作業日報', year: nowyear});
	});
});

app.post('/list/delete/:id', function(req, res){
	var CouchID = req.body.delete_id;
	CouchCnt.DeleteDocument(CouchID, function(err, result){
		CouchCnt.getView(function(err,View){
			if(err){
			res.render('err', {title: 'エラー'});
			return;
			}
			var ArrayView = new Array();
			var Arraynum = 0;
			for(var i = 0; i < View.length; i++){
    			if(View[i].id != CouchID){
    				var json = {
    				id: View[i].id,
    				create_date: View[i].key,
    				value: View[i].value
    				};
    				
    				ArrayView[Arraynum] = json;
    				Arraynum++;
    			}
    		};
    		console.log(ArrayView);
			res.render('list', {title: '履歴' , histry: ArrayView});
		}); 
	});
});

app.post('/list', function(req, res){
	CouchCnt.getView(function(err,View){
		if(err){
		res.render('err', {title: 'エラー'});
		return;
		}
		
		var ArrayView = new Array();
		var Arraynum = 0;
		var searchtitle = req.body.search_title;
		var searchworker = req.body.search_worker;
		var searchcontent = new RegExp(req.body.search_content, "i");
		
		for(var i = 0; i < View.length; i++){
    		if(View[i].value[1].indexOf(searchtitle) >= 0 && View[i].value[0].indexOf(searchworker) >= 0 && View[i].value[2].match(searchcontent) != null){
    			var json = {
    			id: View[i].id,
    			create_date: View[i].key,
    			value: View[i].value
    			};
    			
    			ArrayView[Arraynum] = json;
    			Arraynum++;
    		}
    	};
    	console.log(ArrayView);
		res.render('list', {title: '履歴' , histry: ArrayView});
	}); 
});

app.listen(8080);