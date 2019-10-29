<template>
    <ul v-cloak id="me-emote-autocomplete" class="me-autocomplete" v-show="showMenu" role="listbox">
        <li v-for="(emote, index) in filteredEmotes" v-bind:key="emote.id">
            <button class="me-autocomplete-emote" :class="{ selected: isSelected(index) }" style="align-items: center;display: inline-flex;" v-on:click="autocompleteEmote(emote)">
                <span class="elixr-custom-emote twentyfour me-emotes-preview">
                    <img :src="emoteUrl(emote)">
                </span>
                <span class="emote-name">{{emote.name}}</span>
            </button>
        </li>
        <div class="me-autocomplete-footer">
            <span>Press <b>tab</b> to autocomplete.</span>
        </div>
    </ul>
</template>

<script>
export default {
    data: function() {
        return {
            show: false,
            query: "",
            emotes: [],
            selectedEmoteIndex: 0,
            currentStreamerId: 0
        }
    },
    computed: {
        filteredEmotes: function() {
            return this.emotes.filter(e => e.name.startsWith(this.query))
        },
        showMenu: function() {
            return this.query != null && this.query.length > 0 && this.filteredEmotes.length > 0;
        }
    },
    watch: {
        query: function() {
            if(this.selectedEmoteIndex > this.filteredEmotes.length - 1) {
                this.selectedEmoteIndex = 0;
            }
        }
    },
    methods: {
        incrementSelectedEmote: function() {
            if(this.selectedEmoteIndex >= this.filteredEmotes.length - 1) {
                this.selectedEmoteIndex = 0;
            } else {
                this.selectedEmoteIndex++;
            }
        },
        decrementSelectedEmote: function() {
            if(this.selectedEmoteIndex <= 0) {
                this.selectedEmoteIndex = this.filteredEmotes.length - 1;
            } else {
                this.selectedEmoteIndex--;
            }
        },
        isSelected: function(index) {
            return index === this.selectedEmoteIndex;
        },
        escapeHTML: function(unsafeText) {
            let div = document.createElement('div');
            div.innerText = unsafeText;
            return div.innerHTML.replace(/"/g, '&quot;');
        },
        emoteUrl: function(emote) {
            let url;
            if (emote.global) {
                url = `https://crowbartools.com/user-content/emotes/global/${this.escapeHTML(emote.filename)}`;
            } else {
                url = `https://crowbartools.com/user-content/emotes/live/${this.currentStreamerId}/${this.escapeHTML(emote.filename)}`;
            }
            return url;
        },
        autocompleteSelectedEmote: function() {
            let selectedEmote = this.filteredEmotes[this.selectedEmoteIndex];
            if(selectedEmote) {
                this.autocompleteEmote(selectedEmote);
            }
        },
        autocompleteEmote: function(emote) {
            let nameMinusQuery = emote.name.substring(this.query.length, emote.name.length) + " ";

            let textArea = $("#chat-input").children("textarea");
            let currentText = textArea.val();
            textArea.val(currentText + nameMinusQuery);

            this.query = "";
            
            this.selectedEmoteIndex = 0;
            textArea.focus();
        }
    }
}
</script>
