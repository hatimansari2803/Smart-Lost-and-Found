
package SmartLostFound;

import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/items")
@CrossOrigin(origins = "*")
public class ItemController {

    private final ItemRepository itemRepository;

    public ItemController(ItemRepository itemRepository) {
        this.itemRepository = itemRepository;
    }

    @GetMapping
    public List<Item> getAllItems() {
        return itemRepository.findAll();
    }

    @PostMapping
    public Item addItem(@RequestBody Item item) {
        return itemRepository.save(item);
    }

    @PutMapping("/{id}")
    public Item updateItem(@PathVariable Long id,
                           @RequestBody Item updatedItem) {
        Item item = itemRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Item not found: " + id));

        item.setItemName(updatedItem.getItemName());
        item.setLocation(updatedItem.getLocation());
        item.setStatus(updatedItem.getStatus());
        item.setDescription(updatedItem.getDescription());
        item.setContact(updatedItem.getContact());

        return itemRepository.save(item);
    }

    @DeleteMapping("/{id}")
    public void deleteItem(@PathVariable Long id) {
        itemRepository.deleteById(id);
    }
}
