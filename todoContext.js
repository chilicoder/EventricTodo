Promise = require('promise');
var eventric = require('eventric');

var todoContext = eventric.context('Todo');

todoContext.defineDomainEvents({
    TodoCreated: function(params) {},
    TodoDescriptionChanged: function(params) {
        this.description = params.description;
    }
});

todoContext.addAggregate('Todo', function() {
    this.create = function() {
        this.$emitDomainEvent('TodoCreated');
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
