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

todoContext.addAggregate('Todo', function() {
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
    }
});

todoContext.addCommandHandlers({
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


todoContext.initialize()
    .then(function() {
        todoContext.command('CreateTodo');
    })
    .then(function(todoId) {
        todoContext.command('ChangeTodoDescription', {
            id: todoId,
            description: 'Do something'
        });
    });

setInterval(function () {
    console.log(Date());
    todoContext.command('ChangeTodoDescription', {
        description: 'Do something '+Date()
    });

},5000);
