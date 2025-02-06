import tensorflow as tf
from tensorflow.keras import layers, models
from tensorflow.keras.applications import EfficientNetB0
from tensorflow.keras.applications.efficientnet import preprocess_input

# -------------------------
# 1. Data Loading and Setup
# -------------------------

# Define parameters
data_dir = r"C:\Users\LENOVO\Desktop\PlantVillage-Dataset\raw\color"
img_size = (224, 224)
batch_size = 32
seed = 123

# Create training dataset (80% of data)
train_dataset = tf.keras.preprocessing.image_dataset_from_directory(
    data_dir,
    validation_split=0.2,
    subset="training",
    seed=seed,
    image_size=img_size,
    batch_size=batch_size
)

# **Extract class names and number of classes BEFORE applying transformations**
class_names = train_dataset.class_names
num_classes = len(class_names)
print("Found classes:", class_names)

# Create validation dataset (20% of data)
validation_dataset = tf.keras.preprocessing.image_dataset_from_directory(
    data_dir,
    validation_split=0.2,
    subset="validation",
    seed=seed,
    image_size=img_size,
    batch_size=batch_size
)

# Optimize datasets with caching, shuffling (for training), and prefetching
AUTOTUNE = tf.data.AUTOTUNE

train_dataset = train_dataset.cache().shuffle(1000).prefetch(buffer_size=AUTOTUNE)
validation_dataset = validation_dataset.cache().prefetch(buffer_size=AUTOTUNE)

# -------------------------
# 2. Data Augmentation Setup
# -------------------------

# Build a Keras Sequential model for on-the-fly data augmentation.
data_augmentation = tf.keras.Sequential([
    layers.RandomFlip("horizontal"),
    layers.RandomRotation(0.1),
    layers.RandomZoom(0.1)
], name="data_augmentation")

# -------------------------
# 3. Build the Model
# -------------------------

# Load the pre-trained EfficientNetB0 model without the top classification layers.
base_model = EfficientNetB0(weights='imagenet', include_top=False, input_shape=img_size + (3,))
base_model.trainable = False  # Freeze the base model initially

# Build the full model by chaining augmentation, preprocessing, base model, and classification head.
inputs = tf.keras.Input(shape=img_size + (3,))
x = data_augmentation(inputs)          # Apply augmentation (only active during training)
x = preprocess_input(x)                # Apply preprocessing required by EfficientNet
x = base_model(x, training=False)      # Pass the input through the base model
x = layers.GlobalAveragePooling2D()(x) # Reduce the spatial dimensions
x = layers.Dropout(0.2)(x)             # Add dropout for regularization
outputs = layers.Dense(num_classes, activation='softmax')(x)  # Final classification layer
model = models.Model(inputs, outputs)

model.summary()

# -------------------------
# 4. Compile and Train the Model
# -------------------------

model.compile(
    optimizer=tf.keras.optimizers.Adam(learning_rate=1e-3),
    loss='sparse_categorical_crossentropy',
    metrics=['accuracy']
)

# Set callbacks for early stopping and model checkpointing
callbacks = [
    tf.keras.callbacks.EarlyStopping(monitor='val_loss', patience=5, restore_best_weights=True),
    tf.keras.callbacks.ModelCheckpoint("best_model.h5", monitor='val_loss', save_best_only=True)
]

# Initial training
initial_epochs = 20
history = model.fit(
    train_dataset,
    validation_data=validation_dataset,
    epochs=initial_epochs,
    callbacks=callbacks
)

# -------------------------
# 5. Fine-Tuning the Model
# -------------------------

# Unfreeze the base model for fine-tuning
base_model.trainable = True

# Optionally freeze some of the earlier layers in the base model to retain low-level features.
fine_tune_at = 100  # Adjust this value based on your model and dataset
for layer in base_model.layers[:fine_tune_at]:
    layer.trainable = False

# Re-compile the model with a lower learning rate for fine-tuning.
model.compile(
    optimizer=tf.keras.optimizers.Adam(learning_rate=1e-4),
    loss='sparse_categorical_crossentropy',
    metrics=['accuracy']
)

fine_tune_epochs = 10
total_epochs = initial_epochs + fine_tune_epochs

history_fine = model.fit(
    train_dataset,
    validation_data=validation_dataset,
    epochs=total_epochs,
    initial_epoch=history.epoch[-1],
    callbacks=callbacks
)

# -------------------------
# 6. Save the Final Model
# -------------------------

model.save("crop_disease_detector_final.h5")
