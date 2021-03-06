module("Core");

	test("Public API exists", 6, function () {
		ok(wrench, "wrench global object should exist");
		equal(typeof route,             "function", "route global function should exist");
    equal(typeof routePartial,      "function", "route global function should exist");
    equal(typeof route().to,        "function", "route should return an object with the to function");
    equal(typeof routePartial().to, "function", "routePartial should return an object with the to function");
		equal(typeof wrench.appify,     "function", "wrench.appify function should exist");
	});
	
  
	test("Should create a new wrench app", 2, function () {
		var app = wrench.appify({foo: 'bar'});
		equal(typeof app.run, "function", "should have a run function");
		equal(app.foo,        "bar",      "should have a foo property that returns 'bar'");
	});
	
	test("Should run a wrench app", 1, function () {
		var app = wrench.appify({foo: 'bar', init: function () { app.bar = 'baz'; } });
		app.run(true);
		
		equal(app.bar, "baz", "run should run the init() function and add the property bar");
	});
	
	
module("Routing", {setup: reset, teardown: reset});

  function reset() {
    window.location.hash = '';
  };
  
  // full routing
  
  test("2 full route calls should result in 1 URL", 6, function () {
  	var app = wrench.appify({
  	  foo: route("foo/bar").to(function () {
  	    app.foobarRoute = "ran";
  	  }),
  	  
  	  bar: route("bar/baz").to(function () {
  	    app.barbazRoute = "ran";
  	  })
  	});
  	app.run(true);
  	
  	equal(typeof app.foobarRoute, "undefined");
    equal(typeof app.barbazRoute, "undefined");
    
    app.foo();
    equal(window.location.hash, "#foo/bar");
    equal(app.foobarRoute, "ran");
    
    app.bar();
    equal(window.location.hash, "#bar/baz");
    equal(app.barbazRoute, "ran");
  });
  
  
  // Partial routing
  
  test("calling a partial route on a full route should remove the full", 9, function () {
  	var app = wrench.appify({
  	  foo: route("foo/bar").to(function () {
  	    app.foobarRoute = "ran";
  	  }),
  	  
  	  bar: routePartial("bar/baz").to(function () {
  	    app.barbazRoute = "ran";
  	  }),
  	  
  	  baz: routePartial("baz/bob").to(function () {
  	    app.bazbobRoute = "ran";
  	  }),
  	});
  	app.run(true);
  	
  	equal(typeof app.foobarRoute, "undefined");
    equal(typeof app.barbazRoute, "undefined");
    equal(typeof app.bazbobRoute, "undefined");
    
    app.foo();
    equal(window.location.hash, "#foo/bar");
    equal(app.foobarRoute, "ran");
    
    app.bar();
    equal(window.location.hash, "#bar/baz");
    equal(app.barbazRoute, "ran");
    
    app.baz();
    equal(window.location.hash, "#bar/baz;baz/bob");
    equal(app.bazbobRoute, "ran");
  });

  asyncTest("add #foo/bar route", 2, function () {
  	var app = wrench.appify({
  	  foo: routePartial("foo/bar").to(function () {
  	    app.foobarRoute = "ran";
  	  })
  	});
  	app.run(true);
  	
  	equal(typeof app.foobarRoute, "undefined", "should not yet have the foobarRoute property");
  	window.location.hash = "foo/bar";
  	setTimeout(function () {
      equal(app.foobarRoute, "ran", "should have executed the route function");
      start();
    }, 200);
  });
  
  asyncTest("should run 2 route partials", 3, function () {
  	var app = wrench.appify({
  	  init: function () {
  	    app.partials = 0;
  	  },
  	  partialOne: routePartial("partialone/foo").to(function () {
  	    app.partials++;
  	  }),
  	  partialTwo: routePartial("partialtwo/bar").to(function () {
        app.partials++;
  	  })
  	});
  	app.run(true);
  	
  	equal(app.partials, 0, "no partial routes should be excecuted");
  	window.location.hash = "partialone/foo;partialtwo/bar";
  	setTimeout(function () {
      equal(app.partials, 2, "both partial routes should be excecuted");
      equal(window.location.hash, "#partialone/foo;partialtwo/bar");
      start();
    }, 200);
  });
  
  asyncTest("should create a params hash and pass it to the route function", 4, function () {
    var app = wrench.appify({
      paramsRoute: routePartial("foo/bar").to(function (params) {
        app.params = params;
      })
    });
    app.run(true);
    
    equal(typeof app.params, "undefined", "app.params should not exist");
    window.location.hash = "foo/bar?one=two&three=four";
    stop();
  	setTimeout(function () {    
      ok(typeof app.params !== 'undefined', "app.params should now exist");
      equal(app.params["one"],    "two",  "app.params['one'] should exist and contain 'two'");
      equal(app.params["three"],  "four", "app.params['three'] should exist and contain 'four'");
      start();
    }, 200);
  });
  
  asyncTest("should create params from a named params route", 7, function () {
    var app = wrench.appify({
      list: routePartial("list/:view").to(function (params) {
        app.params = params;
      }),
      show: routePartial("show/:section/:id").to(function (params) {
        app.params = params;
      })
    });
    app.run(true);
    
    equal(typeof app.params, "undefined", "app.params should not exist");
    window.location.hash = "list/all";    
    setTimeout(function () {
      ok(typeof app.params !== 'undefined', "app.params should now exist");
      equal(app.params["view"], "all", "app.params['view'] should exist and contain 'all'");
      
      
      app.params = undefined;
      window.location.hash = "";
      setTimeout(function () {
        equal(typeof app.params, "undefined", "app.params should not exist");
        
        
        window.location.hash = "show/green/432";
        setTimeout(function () {
          ok(typeof app.params !== 'undefined', "app.params should now exist");
          equal(app.params["section"], "green", "app.params['section'] should exist and contain 'green'");
          equal(app.params["id"], "432", "app.params['id'] should exist and contain '432'");
          start();
        }, 200);
        
      }, 200);
      
    }, 200);
  });
  
  test("should create a hash with named params from route2Hash", 1, function () {
    var app = wrench.appify({
      list: routePartial("list/:view").to(function (params) {
        app.params = params;
      })
    });
    app.run(true);
    
    app.list({'view': 'all'});
    equal(window.location.hash, "#list/all", "window.location.hash should be '#list/all'");    
  });
  
  asyncTest("should only run a the route of the partial that was changed", 3, function () {
   	var app = wrench.appify({
   	  init: function () {
   	    app.partials = 0;
   	  },
   	  partialOne: routePartial("partialone/foo").to(function () {
   	    app.partials++;
   	  }),
   	  partialTwo: routePartial("partialtwo/bar").to(function () {
         app.partials++;
   	  })
   	});
   	app.run(true);
   	
   	equal(app.partials, 0, "no partial routes should be excecuted");
   	window.location.hash = "partialone/foo;partialtwo/bar";
   	setTimeout(function () {
      equal(app.partials, 2, "both partial routes should be excecuted");    
      
      window.location.hash = "partialone/foo;partialtwo/bar?foo=bar";
     	setTimeout(function () {
        equal(app.partials, 3, "on partialtwo should run now partial routes should be excecuted");
        start();
      }, 200);
    }, 200);
  });
  
  test("a call to a routed function should get a params object", 4, function () {
    var app = wrench.appify({
      list: routePartial("list/:view").to(function (params) {
        app.params = params;
      })
    });
    app.run(true);
    
    app.list({'view': 'inbox'});
    equal(window.location.hash, "#list/inbox", "location.hash should be equal to '#list/inbox'");
    ok("params" in app, "the params object should exist in app");
    ok('view' in app.params, "'view' should exist in app.params")
    equal(app.params['view'], 'inbox', "app.params['view'] should be 'inbox'");
  });
  
  test("a call to a routed function should change location.hash", 2, function () {
    var app = wrench.appify({
      numberOfRuns: 0,
      routeOne: routePartial("foo/bar").to(function () {
        app.numberOfRuns++;
      })
    });
    app.run(true);
    
    app.routeOne();
    equal(window.location.hash, "#foo/bar", "location.hash should be equal to '#foo/bar'");
    equal(app.numberOfRuns,     1,          "the routeOne function should only be ran once");
  });

  test("a call to a routed function should change location.hash partial if exists", 8, function () {
    var app = wrench.appify({
      listCalled: 0,
      showCalled: 0,
      list: routePartial("list/:view").to(function (params) {
        app.listCalled++;
      }),
      show: routePartial('show/:id').to(function (params) {
        app.showCalled++;
      })      
    });
    app.run(true);
    
    app.list({'view': 'all'});
    equal(window.location.hash, "#list/all", "location.hash should be equal to '#list/all'");
    equal(app.listCalled, 1, 'list should have been called once');

    app.show({'id': '84821'});
    equal(window.location.hash, "#list/all;show/84821", "location.hash should be equal to '#list/all;show/82821'");
    equal(app.listCalled, 1, 'list should still only have been called once');
    equal(app.showCalled, 1, 'show should have been called once');


    app.list({'view': 'failed'});
    equal(window.location.hash, "#list/failed;show/84821", "location.hash should be equal to '#list/failed;show/84821'");
    equal(app.listCalled, 2, 'list should now have been called twice');
    equal(app.showCalled, 1, 'show should still only have been called once');
  });
  
  asyncTest("should add route event handler to all forms with a # in the action", 6, function () {   
    var app = wrench.appify({
      numberOfRuns: 0,
      login: routePartial("login").to(function (params) {
        app.params = params;
        app.numberOfRuns++;
      })
    });
    app.run(true);
    
    ok(typeof app.params === 'undefined', "app.params should not exist");  
    simulateEvent(document.getElementsByTagName("form")[0], 'submit');
    setTimeout(function () {
      equal(window.location.hash, "#login?username=frank&password=s3cret", "the form data should have submitted to the location.hash");
      ok(typeof app.params !== 'undefined',   "app.params should now exist");
      if (app.params && "username" in app.params && "password" in app.params) {
        equal(app.params["username"], "frank",  "app.params['username'] should exist and contain 'frank'");
        equal(app.params["password"], "s3cret", "app.params['password'] should exist and contain 's3cret'");
      }
      equal(app.numberOfRuns, 1, "the login function should only be ran once");
      start();
    }, 200);
  });
  
  asyncTest("should remove a partial route from the hash", 7, function () {
    var app = wrench.appify({
      searchCnt: 0, listCnt: 0, displayCnt: 0,
      search: routePartial("search/:query").to(function (params) {
        app.searchCnt += 1;
      }),
      list: routePartial("list/:view").to(function (params) {
        app.listCnt += 1;
        if (params['view'] !== 'search') app.removePartial("search");
      }),
      display: routePartial("display/:id").to(function (params) {
        app.displayCnt += 1;
      })
    });
    app.run(true);
    
    window.location.hash = "search/dogs;list/search;display/123"
    setTimeout(function () {
      equal(app.searchCnt, 1, "search should have been called once");
      equal(app.listCnt, 1, "list should have been called once");
      equal(app.displayCnt, 1, "display should have been called once");
      
      app.list({"view": "all"});
      setTimeout(function () {
        equal(app.searchCnt, 1, "search should have been called once");
        equal(app.listCnt, 2, "list should have been called twice");
        equal(app.displayCnt, 1, "display should have been called once");
        
        equal(window.location.hash, "#list/all;display/123");
        
        start();
      }, 200);
    }, 200);
    
    
  });