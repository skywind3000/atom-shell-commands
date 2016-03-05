AtomShellCommandsView = require './atom-shell-commands-view'
{CompositeDisposable} = require 'atom'

module.exports = AtomShellCommands =
  atomShellCommandsView: null
  modalPanel: null
  subscriptions: null

  activate: (state) ->
    @atomShellCommandsView = new AtomShellCommandsView(state.atomShellCommandsViewState)
    @modalPanel = atom.workspace.addModalPanel(item: @atomShellCommandsView.getElement(), visible: false)

    # Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    @subscriptions = new CompositeDisposable

    # Register command that toggles this view
    @subscriptions.add atom.commands.add 'atom-workspace', 'atom-shell-commands:toggle': => @toggle()

  deactivate: ->
    @modalPanel.destroy()
    @subscriptions.dispose()
    @atomShellCommandsView.destroy()

  serialize: ->
    atomShellCommandsViewState: @atomShellCommandsView.serialize()

  toggle: ->
    console.log 'AtomShellCommands was toggled!'

    if @modalPanel.isVisible()
      @modalPanel.hide()
    else
      @modalPanel.show()
