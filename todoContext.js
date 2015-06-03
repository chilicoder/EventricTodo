Promise = require('promise');
var eventric = require('eventric');

eventric.log.setLogLevel('debug');

var todoContext = eventric.context('Todo');

todoContext.defineDomainEvents({
    TodoCreated: function(params) {
        console.log('Created todo',params);
    },
    TodoDescriptionChanged: function(params) {
        this.description = params.description;
    }
});

todoContext = todoContext.addAggregate('Todo', function() {
    this.create = function(param) {
        this.$emitDomainEvent('TodoCreated',param);
    };
    this.changeDescription = function(description) {
        this.$emitDomainEvent('TodoDescriptionChanged', {description: description});
    };
});

todoContext.addCommandHandlers({
    CreateTodo: function(params) {
        return this.$aggregate.create('Todo')
            .then(function (todo) {
                return todo.$save();
            });
    },
    ChangeTodoDescription: function(params) {
        return this.$aggregate.load('Todo', params.id)
            .then(function (todo) {
                todo.changeDescription(params.description);
                return todo.$save();
            });
    }
});


todoContext.subscribeToDomainEvent('TodoDescriptionChanged', function(domainEvent) {
    console.log('blabla',domainEvent.payload.description);
});

var todoInstance = todoContext.initialize()
    .then(function(value) {
        return todoContext.command('CreateTodo');
    })
    .then(function(todoId) {
        todoIdd = todoId;
        console.log('todoId',todoId);
        return todoContext.command('ChangeTodoDescription', {
            id: todoId,
            description: 'Do something'
        });
    });


todoInstance.then(function(id){
    setInterval(function () {
        console.log(Date());
        todoContext.command('ChangeTodoDescription', {
            id: id,
            description: 'Do something '+Date()
        });

    },5000);
});




